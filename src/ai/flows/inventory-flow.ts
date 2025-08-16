
'use server';
/**
 * @fileOverview A flow for updating inventory.
 *
 * - updateInventory - A function that handles updating the inventory.
 * - UpdateInventoryInput - The input type for the updateInventory function.
 * - UpdateInventoryOutput - The return type for the updateInventory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const UpdateInventoryInputSchema = z.object({
  name: z.string().describe('The name of the tire.'),
  quantity: z.number().describe('The quantity of tires.'),
  type: z.enum(['import', 'export']).describe('The type of transaction.'),
});
export type UpdateInventoryInput = z.infer<typeof UpdateInventoryInputSchema>;

export const UpdateInventoryOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type UpdateInventoryOutput = z.infer<
  typeof UpdateInventoryOutputSchema
>;

export async function updateInventory(
  input: UpdateInventoryInput
): Promise<UpdateInventoryOutput> {
  return await updateInventoryFlow(input);
}

const updateInventoryFlow = ai.defineFlow(
  {
    name: 'updateInventoryFlow',
    inputSchema: UpdateInventoryInputSchema,
    outputSchema: UpdateInventoryOutputSchema,
  },
  async (input) => {
    console.log('Received inventory update:', input);

    // In a real application, you would make a call to an external API here.
    // For example:
    // const externalApiResponse = await fetch('https://api.inventory.com/update', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(input),
    // });
    // if (!externalApiResponse.ok) {
    //   return {
    //     success: false,
    //     message: 'Failed to update inventory.',
    //   };
    // }
    
    const message =
      input.type === 'import'
        ? `Đã nhập ${input.quantity} lốp ${input.name} thành công.`
        : `Đã xuất ${input.quantity} lốp ${input.name} thành công.`;

    return {
      success: true,
      message,
    };
  }
);
