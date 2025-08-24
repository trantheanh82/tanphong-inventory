
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

const UpdateInventoryInputSchema = z.object({
  name: z.string().describe('The name of the tire.'),
  quantity: z.number().describe('The quantity of tires.'),
  type: z.enum(['import', 'export']).describe('The type of transaction.'),
});
export type UpdateInventoryInput = z.infer<typeof UpdateInventoryInputSchema>;

const UpdateInventoryOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type UpdateInventoryOutput = z.infer<
  typeof UpdateInventoryOutputSchema
>;

export async function updateInventory(
  input: UpdateInventoryInput
): Promise<UpdateInventoryOutput> {
  const updateInventoryFlow = ai.defineFlow(
    {
      name: 'updateInventoryFlow',
      inputSchema: UpdateInventoryInputSchema,
      outputSchema: UpdateInventoryOutputSchema,
    },
    async (input) => {
      console.log('Received inventory update:', input);

      try {
        const response = await fetch(process.env.API_ENDPOINT!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          console.error('API call failed:', await response.text());
          return {
            success: false,
            message: 'Failed to update inventory via API.',
          };
        }
        
        const message =
          input.type === 'import'
            ? `Đã nhập ${input.quantity} lốp ${input.name} thành công.`
            : `Đã xuất ${input.quantity} lốp ${input.name} thành công.`;
  
        return {
          success: true,
          message,
        };

      } catch (error) {
        console.error('Error calling API:', error);
        return {
          success: false,
          message: 'An error occurred while updating inventory.',
        };
      }
    }
  );
  return await updateInventoryFlow(input);
}
