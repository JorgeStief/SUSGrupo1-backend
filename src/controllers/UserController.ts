import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { validate } from "class-validator";

import { User } from "../entity/User";

class UserController{

static index = async (req: Request, res: Response) => {
  //Get users from database
  const userRepository = getRepository(User);
  const users = await userRepository.find({
    select: ["id", "firstName", "role"] //We dont want to send the passwords on response
  });

  //Send the users object
  res.send(users);
};

static show = async (req: Request, res: Response) => {
  //Get the ID from the url
  const id: number = parseInt(req.params.id);

  //Get the user from database
  const userRepository = getRepository(User);
  try {
    const user = await userRepository.findOneOrFail(id, {
      select: ["id", "firstName", "role"] //We dont want to send the password on response
    });
  } catch (error) {
    res.status(404).send("User not found");
  }
};

static store = async (req: Request, res: Response) => {
  //Get parameters from the body
  let { firstName, lastName, cpf, password, mother, email, cep, address, number, city, uf, neighborhood, role } = req.body;
  let user = new User();
  user.firstName = firstName;
  user.lastName = lastName;
  user.cpf = cpf;
  user.role = role;
  user.mother = mother;
  user.email = email;
  user.cep = cep;
  user.password = password
  user.address = address;
  user.number = number;
  user.city = city;
  user.uf = uf;
  user.neighborhood = neighborhood;

  //Validade if the parameters are ok
  const errors = await validate(user);
  if (errors.length > 0) {
    return res.status(400).send({errors});
    
  }

  //Hash the password, to securely store on DB
  user.hashPassword();
  user.aleatorySusCardNumber()

  //Try to save. If fails, the username is already in use
  const userRepository = getRepository(User);
  try {
    await userRepository.save(user);
  } catch (e) {
    return res.status(409).send("username already in use");
    
  }

  //If all ok, send 201 response
  return res.status(201).send("User created");
};

static update = async (req: Request, res: Response) => {
  //Get the ID from the url
  const id = req.params.id;
  console.log(id)
  //Get values from the body
  const { firstName, lastName } = req.body;

  //Try to find user on database
  const userRepository = getRepository(User);
  let user;
  try {
    user = await userRepository.findOneOrFail(id);
  } catch (error) {
    //If not found, send a 404 response
    res.status(404).send("User not found");
    return;
  }

  //Validate the new values on model
  user.firstName = firstName;
  user.lastName = lastName;

  const errors = await validate(user);

  if (errors.length > 0) {
    return res.status(400).send({error: errors});
  }

  //Try to safe, if fails, that means username already in use
  try {
    user = await userRepository.save(user);
  } catch (e) {
    return res.status(409).send("firstName or lastName already in use");
  }
  //After all send a 204 (no content, but accepted) response
  return res.status(204).send();
};

static delete = async (req: Request, res: Response) => {
  //Get the ID from the url
  const id = req.params.id;

  const userRepository = getRepository(User);
  let user: User;
  try {
    user = await userRepository.findOneOrFail(id);
  } catch (error) {
    return res.status(404).send("User not found");
  }
  userRepository.delete(id);

  //After all send a 204 (no content, but accepted) response
  return res.status(204).send();
};
};

export default UserController;