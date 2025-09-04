export interface User {
  id: string;
  email: string;
  avatar: string;
  name: string;
}

export interface Employee {
  fields: {
    name: string;
    username: string;
    position: string;
    user: {
      id: string;
      email: string;
      title: string;
      avatarUrl: string;
    };
  };
  name: string;
  id: string;
  autoNumber: number;
  createdTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
}
