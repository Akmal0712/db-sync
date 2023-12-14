import { mongodb } from "../../storage/mongodb";
import Customer from "./customer.model";
import { generateCustomers } from "./generator";
import { setTimeout } from "node:timers/promises";
import "dotenv/config";

(async () => {
  try {
    await mongodb(process.env.DB_URI);
    while (true) {
      await setTimeout(200);

      const randomNumUpTo10 = Math.floor(Math.random() * 10) + 1;
      const customers: Customer[] = generateCustomers(randomNumUpTo10);
      await Customer.insertMany(customers);

      console.log(`Inserted ${customers.length} customers`);
    }
  } catch (error) {
    console.log(error.message);
  }
})();
