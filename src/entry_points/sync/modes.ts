import CustomerModel from "../app/customer.model";
import CustomerAnonymizedModel from "./customers_anonymised.model";
import { anonymizeCustomers } from "./anonymizeCustomers";
import CursorModel from "./cursor.model";
import mongoose from "mongoose";

export async function reindex() {
  console.log("Reindexing...");
  const startTime = Date.now();
  const session = await mongoose.startSession();
  session.startTransaction();

  const limit = 1000;
  const batchSize = 1000;
  let cursorFromDb = await CursorModel.findOne({});
  if (!cursorFromDb) {
    await CustomerAnonymizedModel.deleteMany();
    cursorFromDb = await CursorModel.create({});
  }

  let { skip, lte } = cursorFromDb;
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
  const documents = [];
  const changeStream = CustomerModel.watch();
  let pendingDocument = changeStream.next();
  let doc = null;
  let startTime = Date.now();

  await CursorModel.findOneAndUpdate({}, { lte: Date.now() }); // update cursor to current time for real time sync
  console.log("Watching for changes...");
  while (!changeStream.closed) {
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(null), 50),
    );
    if (doc) {
      pendingDocument = changeStream.next();
    }

    doc = await Promise.race([pendingDocument, timeoutPromise]);
    if (doc) {
      documents.push(doc.fullDocument);
    }

    if (documents.length >= 1000) {
      await anonymizeAndInsertCustomers(documents);

      console.log(`Inserted ${documents.length} documents.`);
      documents.length = 0;
      startTime = Date.now();
    }

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= 1000) {
      if (documents.length > 0) {
        await anonymizeAndInsertCustomers(documents);

        console.log(`Inserted ${documents.length} documents by timeout...`);
        documents.length = 0;
      }

      startTime = Date.now();
    }
  }
  console.log("FINISHED");
}

async function anonymizeAndInsertCustomers(customers: Customer[]) {
  try {
    if (customers.length === 0) return;

    const anonymizedCustomers: AnonymizedCustomer[] =
      anonymizeCustomers(customers);
    await CustomerAnonymizedModel.insertMany(anonymizedCustomers);
  } catch (error) {
    console.log(`Error on inserting customers: ${error.message}`);
  }
}
