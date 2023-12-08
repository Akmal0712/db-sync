import * as faker from "@faker-js/faker";
import crypto from "crypto";
export function generateCustomers(): Customer[] {
  const customers: Customer[] = [];
  for (let i = 0; i < Math.floor(Math.random() * 10) + 1; i++) {
    customers.push({
      firstName: faker.fakerEN_US.person.firstName(),
      lastName: faker.fakerEN_US.person.lastName(),
      email: faker.fakerEN_US.internet.email(),
      address: {
        line1: faker.fakerEN_US.location.streetAddress(),
        line2: faker.fakerEN_US.location.secondaryAddress(),
        postcode: faker.fakerEN_US.location.zipCode(),
        city: faker.fakerEN_US.location.city(),
        state: faker.fakerEN_US.location.state(),
        country: faker.fakerEN_US.location.country(),
      },
    });
  }

  return customers;
}

export function anonymizeCustomers(customers: Customer[]): Customer[] {
  console.log("Anonymizing customers...");
  const customersAnonymized: Customer[] = [];
  try {
    for (const customer of customers) {
      customersAnonymized.push({
        firstName: hashStringToPseudoRandom(customer.firstName),
        lastName: hashStringToPseudoRandom(customer.lastName),
        email: `${hashStringToPseudoRandom(customer.email.split("@")[0])}@${
          customer.email.split("@")[1]
        }`,
        address: {
          ...customer.address,
          line1: hashStringToPseudoRandom(customer.address.line1),
          line2: hashStringToPseudoRandom(customer.address.line2),
          postcode: hashStringToPseudoRandom(customer.address.postcode),
        },
      });
    }
  } catch (e) {
    console.log("skipping customer with wrong data format");
  }

  return customersAnonymized;
}

function hashStringToPseudoRandom(inputString) {
  const hash = crypto.createHash("sha256");
  hash.update(inputString);
  const hashedString = hash.digest("hex").replace(/[^a-zA-Z]/g, "");
  return hashedString.substring(0, 8);
}
