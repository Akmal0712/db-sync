import CustomerModel from "../app/customer.model";
import CustomerAnonymizedModel from "./customers_anonymised.model";
import { anonymizeCustomers } from "./anonymizer";
import CursorModel from "./cursor.model";
import mongoose from "mongoose";

type ChangeStreamDocument<T> = {
  operationType: "insert" | "update";
  fullDocument: T;
} | null;

export async function reindex() {
  console.log("Reindexing...");
  const startTime = Date.now();
  const session = await mongoose.startSession();
  session.startTransaction();

  const lte =
    (await CustomerAnonymizedModel.findOne({}).sort({ createdAt: -1 }))
      ?.createdAt || new Date();
  let cursorFromDb = await CursorModel.findOne({});
  if (!cursorFromDb) {
    cursorFromDb = await CursorModel.create({});
    await CustomerAnonymizedModel.deleteMany({ createdAt: { $lte: lte } });
  }

  // search settings
  let { skip } = cursorFromDb;
  const limit = 1000;
  const batchSize = 1000;

  let customers: Customer[] = [];
  const cursor = await CustomerModel.find({
    createdAt: {
      $lte: lte,
    },
  })
    .sort({ _id: 1 })
    .cursor({ batchSize, skip });

  for (let doc; doc !== null; ) {
    doc = await cursor.next();
    if (doc) customers.push(doc);
    if (customers.length === limit || (doc === null && customers.length > 0)) {
      const anonymizedCustomers: AnonymizedCustomer[] =
        anonymizeCustomers(customers);
      try {
        await CustomerAnonymizedModel.insertMany(anonymizedCustomers);
        await CursorModel.updateOne({}, { skip: skip + customers.length });

        await session.commitTransaction();
        skip += customers.length;
        console.log(
          `Inserted ${customers.length} customers. Total inserted documents: ${skip}`,
        );

        customers.length = 0;
      } catch (error) {
        await session.abortTransaction();
        console.log(error.message);
      } finally {
        await session.endSession();
      }
    }
  }

  await CursorModel.deleteMany({});
  console.log(`Finished in ${Date.now() - startTime} ms.`);
}

export async function realTimeSync() {
  const documentsForUpdate = [];
  const documentsForInsert = [];
  const changeStream = CustomerModel.watch([], {
    fullDocument: "updateLookup",
  });
  let pendingDocument = changeStream.next();
  let doc = null;
  let startTime = Date.now();

  await console.log("Watching for changes...");
  while (!changeStream.closed) {
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(null), 50),
    );
    if (doc) {
      pendingDocument = changeStream.next();
    }

    doc = await Promise.race([pendingDocument, timeoutPromise]);
    if (doc) {
      doc.operationType === "insert"
        ? documentsForInsert.push(doc.fullDocument)
        : documentsForUpdate.push(doc.fullDocument);
    }

    if (documentsForInsert.length + documentsForUpdate.length >= 1000) {
      await anonymizeAndProcess(documentsForInsert, documentsForUpdate);

      console.log(
        `Processed ${
          documentsForInsert.length + documentsForUpdate.length
        } documents.`,
      );
      documentsForInsert.length = 0;
      documentsForUpdate.length = 0;
      startTime = Date.now();
    }

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= 1000) {
      if (documentsForInsert.length + documentsForUpdate.length > 0) {
        await anonymizeAndProcess(documentsForInsert, documentsForUpdate);

        console.log(
          `Processed ${
            documentsForInsert.length + documentsForUpdate.length
          } documents by timeout...`,
        );
        documentsForInsert.length = 0;
        documentsForUpdate.length = 0;
      }

      startTime = Date.now();
    }
  }
  console.log("FINISHED");
}

async function anonymizeAndProcess(
  customersForInsert: Customer[],
  customersForUpdate: Customer[],
) {
  try {
    if (customersForInsert.length > 0) {
      const anonymizedCustomers: AnonymizedCustomer[] =
        anonymizeCustomers(customersForInsert);
      await CustomerAnonymizedModel.insertMany(anonymizedCustomers);
    }

    if (customersForUpdate.length > 0) {
      const anonymizedCustomers: AnonymizedCustomer[] =
        anonymizeCustomers(customersForUpdate);

      await Promise.all(
        anonymizedCustomers.map(async (customer) => {
          await CustomerAnonymizedModel.updateOne(
            { _id: customer._id },
            customer,
          );
        }),
      );
    }
  } catch (error) {
    console.log(`Error on processing customers: ${error.message}`);
  }
}
