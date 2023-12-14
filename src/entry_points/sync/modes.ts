import CustomerModel from "../app/customer.model";
import CustomerAnonymizedModel from "./CustomersAnonymised.model";
import { anonymizeCustomers } from "./anonymizer";
import { ChangeStreamDocument } from "mongodb";
import ResumeTokenModel from "./ResumeToken.model";

export async function reindex() {
  console.log("Reindexing...");
  console.time("Reindexing");

  const lte =
    (await CustomerAnonymizedModel.findOne({}).sort({ createdAt: -1 }))
      ?.createdAt || new Date();

  await CustomerAnonymizedModel.collection.drop();

  const limit = 1000;
  const batchSize = 1000;

  const cursor = CustomerModel.find({
    createdAt: {
      $lte: lte,
    },
  })
    .sort({ _id: 1 })
    .cursor({ batchSize });

  const customers: Customer[] = [];
  for await (const doc of cursor) {
    customers.push(doc as Customer);
    console.log(doc._id);

    if (customers.length === limit) {
      await CustomerAnonymizedModel.insertMany(anonymizeCustomers(customers));
      console.log(`Total inserted ${customers.length} customers.`);
      customers.length = 0;
    }
  }

  if (customers.length > 0) {
    await CustomerAnonymizedModel.insertMany(customers);
    console.log(`Total inserted ${customers.length} customers.`);
  }

  console.timeEnd("Reindexing");
  console.log("Finished.");
}

export async function realTimeSync() {
  const documents = [];
  let startTime = Date.now();

  const resumeToken = await ResumeTokenModel.findOne();
  const options = resumeToken
    ? { fullDocument: "updateLookup", resumeAfter: resumeToken }
    : { fullDocument: "updateLookup" };
  const changeStream = CustomerModel.collection.watch([], options);

  console.log("Watching for changes...");
  while (!changeStream.closed) {
    const doc: ChangeStreamDocument = await changeStream.tryNext();

    if (doc?.operationType === "insert" || doc?.operationType === "update")
      documents.push(doc.fullDocument);

    if (documents.length >= 14) {
      await anonymizeAndProcess(documents);

      console.log(`Processed ${documents.length} documents.`);
      documents.length = 0;
      await ResumeTokenModel.findOneAndUpdate({}, changeStream.resumeToken, {
        upsert: true,
      });
      startTime = Date.now();
    }

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= 1000) {
      console.log("Timeout...");
      if (documents.length > 0) {
        await anonymizeAndProcess(documents);

        console.log(`Processed ${documents.length} documents by timeout...`);
        documents.length = 0;
        await ResumeTokenModel.findOneAndUpdate({}, changeStream.resumeToken, {
          upsert: true,
        });
      }
      startTime = Date.now();
    }
  }

  console.log("Change Stream closed");
}

async function anonymizeAndProcess(documents: Customer[]) {
  try {
    if (documents.length > 0) {
      const anonymizedCustomers: AnonymizedCustomer[] =
        anonymizeCustomers(documents);
      const bulkItems = anonymizedCustomers.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: doc },
          upsert: true,
        },
      }));

      await CustomerAnonymizedModel.bulkWrite(bulkItems);
    }
  } catch (error) {
    console.log(`Error on processing customers: ${error.message}`);
  }
}
