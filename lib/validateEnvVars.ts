export function validateEnvVars(envVars: string[]): Error | void {
  const unsetEnvVars: string[] = [];

  for (const variable of envVars)
    if (!process.env[variable]) unsetEnvVars.push(variable);

  if (unsetEnvVars.length > 0) throw new Error(`Unset environment variables required to execute lambda.\n\n${unsetEnvVars.join(' ')}\n`);
}