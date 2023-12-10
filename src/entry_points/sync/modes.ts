import CustomerModel from "../app/customer.model";
import CustomerAnonymizedModel from "./customers_anonymised.model";
import { anonymizeCustomers } from "./anonymizeCustomers";
import CursorModel from "./cursor.model";
import mongoose from "mongoose";

export async function reindex() {
  console.log("Reindexing...");
  const session = await mongoose.startSession();
  session.startTransaction();

  const lte = new Date();
  const limit = 1000;
  let cursor = await CursorModel.findOne({});
  if (!cursor) {
    await CustomerAnonymizedModel.deleteMany();
    cursor = await CursorModel.create({});
  }

  let skip = cursor.skip;
  let customers: Customer[];
  do {
    customers = await CustomerModel.find({
      createdAt: {
        $lte: lte,
      },
    })
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: 1 });


    const anonymizedCustomers: AnonymizedCustomer[] = anonymizeCustomers(customers);
    try {
      await CustomerAnonymizedModel.insertMany(anonymizedCustomers);
      await CursorModel.updateOne({}, { skip: skip + customers.length });

      await session.commitTransaction();
      skip += customers.length;

      console.log(`Inserted ${customers.length} customers`);
    }
    catch (error) {
      await session.abortTransaction();
      console.log(error.message);
    }
    finally {
      await session.endSession();
    }
  } while (customers.length > 0);
}

export async function realTimeSync() {
  const documents = [];
  const changeStream = CustomerModel.watch();
  let pendingDocument = changeStream.next();
  let doc = null;
  let startTime = Date.now();

  console.log("Watching for changes...");
  while(!changeStream.closed) {
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 50));
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

    const anonymizedCustomers: AnonymizedCustomer[] = anonymizeCustomers(customers);
    await CustomerAnonymizedModel.insertMany(anonymizedCustomers);
  }
  catch (error) {
    console.log(`Error on inserting customers: ${error.message}`);
  }
}
