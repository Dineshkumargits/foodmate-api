import { encryptSync } from "../util/encrypt";
import User from "../models/User";
import { Op, WhereOptions } from "sequelize";

export const createUser = async (payload: any) => {
  payload.password_hash = encryptSync(payload.password);
  const user = await User.create(payload);
  return user;
};

export const getUserById = async (id: number) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ["password_hash"] },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const userExists = async (
  options: { email: string | null; phone: string | null } = {
    email: null,
    phone: null
  }
) => {
  if (!options.email || !options.phone) {
    throw new Error("Email or Phone is missing");
  }
  const where: any = {
    [Op.or]: [],
  };
  if (options.email) {
    where[Op.or].push({ email: options.email });
  }
  if (options.phone) {
    where[Op.or].push({ phone: options.phone });
  }

  const users = await User.findAll({ where: where });
  return users.length > 0;
};

export const validatePassword = async (email: string, password: string) => {
  if (!email && !password) {
    throw new Error("Please provide email and password");
  }
  const where = {
    [Op.or]: [] as any,
  };

  if (email) {
    where[Op.or].push({ email: email });
  }

  const user = await User.findOne({ where });

  return User.validPassword(password, user.password_hash);
};

export const findOneUser = async (options: any) => {
  if (!options.email && !options.id) {
    throw new Error("Please provide email or id ");
  }
  const where = {
    [Op.or]: [] as any,
  };

  if (options.email) {
    where[Op.or].push({ email: options.email });
  }
  if (options.id) {
    where[Op.or].push({ id: options.id });
  }

  const user = await User.findOne({
    where,
    attributes: { exclude: ["password_hash"] },
  });
  return user;
};

export const updateUserById = (user: any, userId: number) => {
  if (!user && !userId) {
    throw new Error("Please provide user data and/or user id to update");
  }
  if (userId && isNaN(userId)) {
    throw new Error("Invalid user id");
  }
  if (user.id || userId) {
    const id = user.id || userId;

    if (user.password) {
      user.password = encryptSync(user.password);
    }

    return User.update(user, {
      where: { id: id },
    });
  }
};

export const deleteUserById = (userId: number) => {
  if (!userId) {
    throw new Error("Please user id to delete");
  }
  if (userId && isNaN(userId)) {
    throw new Error("Invalid user id");
  }

  return User.destroy({
    where: { id: userId },
  });
};

export const getUsers = async ({ where }: { where: WhereOptions<any> }) => {
  const users = await User.findAll({
    where: { ...where },
    attributes: { exclude: ["password_hash"] },
    raw: true
  });
  return users;
};
