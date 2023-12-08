import CustomerModel from "../app/customer.model";
import CustomerAnonymizedModel from "./customers_anonymised.model";
import { anonymizeCustomers } from "../mods/utils";
export async function reindex() {
  console.log("Reindexing...");
  await CustomerAnonymizedModel.deleteMany();
  const lte = new Date();
  let gte = new Date("2021-01-01T00:00:00.000Z");

  while (gte) {
    const customers: Customer[] = await CustomerModel.find({
      createdAt: {
        $gte: gte,
        $lte: lte,
      },
    })
      .limit(1000)
      .sort({ createdAt: 1 });
    console.log(customers.length);

    const anonymizedCustomers: Customer[] = anonymizeCustomers(customers);
    await CustomerAnonymizedModel.insertMany(anonymizedCustomers);

    const latestCustomer = customers.pop();
    gte = latestCustomer
      ? new Date(new Date(latestCustomer.createdAt).getTime() + 1)
      : null;
  }
}

export async function realTimeSync() {
  console.log("Watching for changes...");

  const documents = [];
  let intervalId;
  function startInterval() {
    clearInterval(intervalId);
    intervalId = setInterval(async () => {
      if (documents.length === 0) return;

      anonymizeAndInsertCustomers(documents);
      console.log(`Inserted ${documents.length} customers, setInterval...`);
      documents.length = 0;
    }, 5000);
  }
  startInterval();

  CustomerModel.watch().on("change", async (change) => {
    documents.push(change.fullDocument);

    if (documents.length >= 90) {
      anonymizeAndInsertCustomers(documents);
      console.log(`Inserted ${documents.length} customers.`);
      documents.length = 0;
      startInterval();
    }
  });
}

async function anonymizeAndInsertCustomers(customers: Customer[]) {
  const anonymizedCustomers: Customer[] = anonymizeCustomers(customers);
  await CustomerAnonymizedModel.insertMany(anonymizedCustomers);
}
