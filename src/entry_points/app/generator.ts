import * as faker from "@faker-js/faker";

export function generateCustomers(count: number): Customer[] {
  const customers: Customer[] = [];
  for (let i = 0; i < count; i++) {
    customers.push({
      firstName: faker.fakerEN_US.person.firstName(),
      lastName: faker.fakerEN_US.person.lastName(),
      email: faker.fakerEN_US.internet.email(),
      address: {
        line1: faker.fakerEN_US.location.streetAddress(),
        line2: faker.fakerEN_US.location.secondaryAddress(),
        postcode: faker.fakerEN_US.location.zipCode(),
        city: faker.fakerEN_US.location.city(),
        state: faker.fakerEN_US.location.state({ abbreviated: true }),
        country: faker.fakerEN_US.location.countryCode(),
      },
      createdAt: new Date(),
    });
  }

  return customers;
}
