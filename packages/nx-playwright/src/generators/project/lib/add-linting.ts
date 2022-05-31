import { GeneratorCallback, joinPathFragments, Tree, updateJson } from '@nrwl/devkit';
import { Linter, lintProjectGenerator } from '@nrwl/linter';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { NxPlaywrightGeneratorNormalizedSchema } from './normalize-options';

type EslintIgnoreFile = {
  extends: string[];
  ignorePatterns: string;
  overrides: { files: string[]; rules: Record<string, string> }[];
};

export async function addLinting(
  host: Tree,
  options: NxPlaywrightGeneratorNormalizedSchema,
): Promise<GeneratorCallback> {
  const lintTask = await lintProjectGenerator(host, {
    linter: options.linter,
    project: options.projectName,
    tsConfigPaths: [joinPathFragments(options.projectRoot, 'tsconfig.app.json')],
    eslintFilePatterns: [`${options.projectRoot}/**/*.{ts,tsx,js,jsx}`],
    skipFormat: true,
  });

  if (options.linter === Linter.EsLint) {
    updateJson(
      host,
      joinPathFragments(options.projectRoot, '.eslintrc.json'),
      (json: EslintIgnoreFile) => {
        const overrides = json.overrides.map(({ files, rules }) =>
          files.includes('*.ts')
            ? { files, rules: { 'jest/no-done-callback': 'off' } }
            : { files, rules },
        );

        return { ...json, overrides, extends: [...json.extends] };
      },
    );
  }

  return runTasksInSerial(lintTask);
}
