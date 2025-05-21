// server/src/modules/pickupOrders/controllers/index.ts

import { Request, Response, NextFunction } from 'express';
import * as pickupOrderService from '../services/pickupOrders.service';

export const getAllPickupOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pickupOrders = await pickupOrderService.findAllPickupOrders();
    res.status(200).json(pickupOrders);
  } catch (error) {
    next(error);
  }
};

export const getPickupOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const pickupOrder = await pickupOrderService.findPickupOrderById(id);
    res.status(200).json(pickupOrder);
  } catch (error) {
    next(error);
  }
};

export const getPickupOrdersByBasin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { basinId } = req.params;
    const pickupOrders = await pickupOrderService.findPickupOrdersByBasin(basinId);
    res.status(200).json(pickupOrders);
  } catch (error) {
    next(error);
  }
};

export const getPickupOrdersByClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clientId } = req.params;
    const pickupOrders = await pickupOrderService.findPickupOrdersByClient(clientId);
    res.status(200).json(pickupOrders);
  } catch (error) {
    next(error);
  }
};

export const createPickupOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pickupOrderData = req.body;
    const pickupOrder = await pickupOrderService.createPickupOrder(pickupOrderData);
    res.status(201).json(pickupOrder);
  } catch (error) {
    next(error);
  }
};

export const updatePickupOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const pickupOrderData = req.body;
    const pickupOrder = await pickupOrderService.updatePickupOrder(id, pickupOrderData);
    res.status(200).json(pickupOrder);
  } catch (error) {
    next(error);
  }
};

export const deletePickupOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const pickupOrder = await pickupOrderService.deletePickupOrder(id);
    res.status(200).json(pickupOrder);
  } catch (error) {
    next(error);
  }
};