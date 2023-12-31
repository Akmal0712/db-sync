interface Customer {
  _id?: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  address: Address;
  createdAt: Date;
}

interface Address {
  line1: string;
  line2: string;
  postcode: string;
  city: string;
  state: string;
  country: string;
}
