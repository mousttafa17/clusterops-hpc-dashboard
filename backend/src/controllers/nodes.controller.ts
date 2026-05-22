import { Request, Response } from 'express';
import { createNode, createNodeSchema, listNodes, updateNodeStatus, updateNodeStatusSchema } from '../services/node.service';

export const listNodesController = async (_req: Request, res: Response) => {
  const nodes = await listNodes();

  return res.status(200).json({
    success: true,
    count: nodes.length,
    data: { nodes }
  });
};

export const createNodeController = async (req: Request, res: Response) => {
  const input = createNodeSchema.parse(req.body);
  const node = await createNode(String(req.user!._id), input);

  return res.status(201).json({
    success: true,
    message: 'Node created successfully',
    data: { node }
  });
};

export const updateNodeStatusController = async (req: Request, res: Response) => {
  const input = updateNodeStatusSchema.parse(req.body);
  const node = await updateNodeStatus(String(req.user!._id), req.params.id, input.status);

  return res.status(200).json({
    success: true,
    message: 'Node status updated successfully',
    data: { node }
  });
};
