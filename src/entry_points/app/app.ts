import { mongodb } from "../../storage/mongodb";
import Customer from "./customer.model";
import { generateCustomers } from "./generator";
import "dotenv/config";

(async () => {
  try {
    await mongodb();

    setInterval(async () => {
      const customers: Customer[] = generateCustomers();
      await Customer.insertMany(customers);
      console.log(`Inserted ${customers.length} customers`);
    }, 200);
  } catch (error) {
    console.log(error.message);
  }
})();
