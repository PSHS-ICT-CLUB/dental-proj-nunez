import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { caseTypes, inventoryItems } from '../src/lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';


const newCaseTypes = [
  { name: 'Zirconia', abbrv: 'Zr' },
  { name: 'PMMA', abbrv: 'PMMA' },
  { name: 'Zirconia Full Contour', abbrv: 'ZFC' },
  { name: 'Ivocap', abbrv: 'IC' },
  { name: 'Temporary Crown', abbrv: 'TC' },
  { name: 'Ordinary Denture', abbrv: 'OD' },
  { name: 'Porcelain Fused to Metal', abbrv: 'PFM' },
  { name: 'Printed Temporary Crown', abbrv: 'PTC' },
  { name: 'Flexible', abbrv: 'Fx' },
  { name: 'Splint', abbrv: 'S' },
  { name: 'Base Plate', abbrv: 'BP' },
  { name: 'Retainer', abbrv: 'R' }
];

const newMaterials = [
  { name: 'Zirconia Blank (ZB)' },
  { name: 'PMMA Blank (PMMA B)' },
  { name: 'Temporary Crown Resin (TCR)' },
  { name: 'Temporary Printed Crown Resin (TPCR)' },
  { name: 'Self Cure Pink Resin (SCPR)' },
  { name: 'Heat Cure Pink Resin (HCPR)' },
  { name: 'Self Cure Clear Resin (SCCR)' },
  { name: 'Heat Cure Clear Resin (HCCR)' },
  { name: 'Granules for Flexite (GRF)' }
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env');
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  try {
    for (const ct of newCaseTypes) {
      const existing = await db.select().from(caseTypes).where(eq(caseTypes.caseTypeAbbrv, ct.abbrv));
      if (existing.length === 0) {
        // Also check by name
        const existingByName = await db.select().from(caseTypes).where(eq(caseTypes.caseTypeName, ct.name));
        if (existingByName.length === 0) {
          await db.insert(caseTypes).values({
            caseTypeName: ct.name,
            caseTypeAbbrv: ct.abbrv,
            numberOfCases: 0
          } as any);
          console.log(`Inserted case type: ${ct.name} (${ct.abbrv})`);
        } else {
          console.log(`Case type exists by name: ${ct.name}`);
          // Update abbreviation
          await db.update(caseTypes).set({ caseTypeAbbrv: ct.abbrv } as any).where(eq(caseTypes.caseTypeName, ct.name));
          console.log(`Updated abbreviation for: ${ct.name}`);
        }
      } else {
        console.log(`Case type abbreviation already exists: ${ct.abbrv}`);
      }
    }

    for (const mat of newMaterials) {
      const existing = await db.select().from(inventoryItems).where(eq(inventoryItems.name, mat.name));
      if (existing.length === 0) {
        await db.insert(inventoryItems).values({
          name: mat.name,
          category: 'Material',
          unit: 'pcs',
          cost: '0',
          currentStock: 0,
          minimumStockLevel: 0
        } as any);
        console.log(`Inserted material: ${mat.name}`);
      } else {
        console.log(`Material already exists: ${mat.name}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
