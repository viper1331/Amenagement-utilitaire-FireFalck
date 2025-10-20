import fs from 'node:fs/promises';
import path from 'node:path';
import {
  equipmentCatalog,
  equipmentModuleJsonSchema,
  equipmentModuleSchema,
  projectJsonSchema,
  projectSchema,
  vehicleBlueprintJsonSchema,
  vehicleBlueprintSchema,
  vehicleBlueprints,
} from '@pkg/data';

const ensureDirectory = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

const readJsonFiles = async (directory: string) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const jsonFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));
  const results: Array<{ name: string; data: unknown }> = [];

  for (const file of jsonFiles) {
    const fullPath = path.join(directory, file.name);
    const content = await fs.readFile(fullPath, 'utf8');
    try {
      results.push({ name: file.name, data: JSON.parse(content) });
    } catch (error) {
      throw new Error(`Impossible de parser ${fullPath}: ${(error as Error).message}`);
    }
  }

  return results;
};

const stringify = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

const writeJsonSchema = async (targetDir: string, fileName: string, schema: unknown) => {
  await ensureDirectory(targetDir);
  const targetPath = path.join(targetDir, fileName);
  await fs.writeFile(targetPath, stringify(schema), 'utf8');
};

const validateUniqueness = <T, Key>(values: T[], getKey: (value: T) => Key, type: string) => {
  const seen = new Map<Key, string>();
  for (const value of values) {
    const key = getKey(value);
    if (seen.has(key)) {
      throw new Error(`Doublon détecté pour ${type}: ${String(key)}`);
    }
    seen.set(key, '1');
  }
};

async function main() {
  const packageRoot = process.cwd();
  const repoRoot = path.resolve(packageRoot, '..', '..');
  const vehiclesDir = path.join(repoRoot, 'packages', 'data', 'vehicles');
  const catalogDir = path.join(repoRoot, 'packages', 'data', 'catalog');
  const schemaOutputDir = path.join(repoRoot, 'packages', 'data', 'json-schema');
  const demoProjectPath = path.join(repoRoot, 'examples', 'demo_project.json');

  const vehicleFiles = await readJsonFiles(vehiclesDir);
  const catalogFiles = await readJsonFiles(catalogDir);

  const vehicles = vehicleFiles.map(({ name, data }) => {
    try {
      return vehicleBlueprintSchema.parse(data);
    } catch (error) {
      throw new Error(`Validation échouée pour ${name}: ${(error as Error).message}`);
    }
  });

  const modules = catalogFiles.map(({ name, data }) => {
    try {
      return equipmentModuleSchema.parse(data);
    } catch (error) {
      throw new Error(`Validation échouée pour ${name}: ${(error as Error).message}`);
    }
  });

  validateUniqueness(vehicles, (vehicle) => vehicle.id, 'vehicle id');
  validateUniqueness(modules, (module) => module.sku, 'module sku');

  const exportedVehicleIds = new Set(vehicleBlueprints.map((entry) => entry.id));
  for (const vehicle of vehicles) {
    if (!exportedVehicleIds.has(vehicle.id)) {
      throw new Error(
        `Le véhicule ${vehicle.id} n'est pas exporté par @pkg/data. Mettre à jour src/index.ts.`,
      );
    }
  }

  const exportedModuleSkus = new Set(equipmentCatalog.map((entry) => entry.sku));
  for (const module of modules) {
    if (!exportedModuleSkus.has(module.sku)) {
      throw new Error(
        `Le module ${module.sku} n'est pas exporté par @pkg/data. Mettre à jour src/index.ts.`,
      );
    }
  }

  if (vehicleBlueprints.length !== vehicles.length) {
    throw new Error('Tous les véhicules exportés ne correspondent pas aux fichiers JSON.');
  }

  if (modules.length !== equipmentCatalog.length) {
    throw new Error(
      'Le nombre de modules exportés ne correspond pas aux fichiers JSON du catalogue.',
    );
  }

  const demoContent = await fs.readFile(demoProjectPath, 'utf8');
  const demoProject = projectSchema.parse(JSON.parse(demoContent));

  await writeJsonSchema(schemaOutputDir, 'vehicle-blueprint.schema.json', vehicleBlueprintJsonSchema);
  await writeJsonSchema(schemaOutputDir, 'equipment-module.schema.json', equipmentModuleJsonSchema);
  await writeJsonSchema(schemaOutputDir, 'project.schema.json', projectJsonSchema);

  console.info(`✔ ${vehicles.length} véhicules validés.`);
  console.info(`✔ ${modules.length} modules validés.`);
  console.info(`✔ Projet de démonstration '${demoProject.name}' conforme au schéma.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
