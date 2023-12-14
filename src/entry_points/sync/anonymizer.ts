import crypto from "crypto";

export function anonymizeCustomers(
  customers: Customer[],
): AnonymizedCustomer[] {
  // console.log("Anonymizing customers...");
  const customersAnonymized: AnonymizedCustomer[] = [];
  for (const customer of customers) {
    customersAnonymized.push({
      ...customer,
      _id: customer._id,
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
  return customersAnonymized;
}

function hashStringToPseudoRandom(inputString) {
  const hash = crypto.createHash("sha256");
  hash.update(inputString);
  const hashedString = hash.digest("base64").replace(/[^a-zA-Z\d]/g, "");
  return hashedString.substring(0, 8);
}
