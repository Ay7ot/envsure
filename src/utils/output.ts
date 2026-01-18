import chalk from 'chalk';

/**
 * Output utilities for consistent CLI formatting
 */

export const symbols = {
    success: chalk.green('✓'),
    error: chalk.red('✗'),
    warning: chalk.yellow('⚠'),
    info: chalk.blue('ℹ'),
    arrow: chalk.gray('→'),
};

export function success(message: string): void {
    console.log(`${symbols.success} ${chalk.green(message)}`);
}

export function error(message: string): void {
    console.log(`${symbols.error} ${chalk.red(message)}`);
}

export function warning(message: string): void {
    console.log(`${symbols.warning} ${chalk.yellow(message)}`);
}

export function info(message: string): void {
    console.log(`${symbols.info} ${chalk.blue(message)}`);
}

export function header(title: string): void {
    console.log();
    console.log(chalk.bold.underline(title));
    console.log();
}

export function table(rows: [string, string][], indent: number = 2): void {
    const padding = ' '.repeat(indent);
    rows.forEach(([key, value]) => {
        console.log(`${padding}${chalk.gray(key)}: ${value}`);
    });
}

export function list(items: string[], indent: number = 2): void {
    const padding = ' '.repeat(indent);
    items.forEach((item) => {
        console.log(`${padding}${chalk.gray('•')} ${item}`);
    });
}

export function code(text: string): string {
    return chalk.cyan(text);
}

export function dim(text: string): string {
    return chalk.dim(text);
}

export function bold(text: string): string {
    return chalk.bold(text);
}

/**
 * Format output as JSON if requested
 */
export function outputJSON(data: unknown): void {
    console.log(JSON.stringify(data, null, 2));
}

/**
 * Print a summary line
 */
export function summary(errors: number, warnings: number): void {
    console.log();
    if (errors === 0 && warnings === 0) {
        success('No issues found');
    } else {
        const parts: string[] = [];
        if (errors > 0) parts.push(chalk.red(`${errors} error${errors !== 1 ? 's' : ''}`));
        if (warnings > 0) parts.push(chalk.yellow(`${warnings} warning${warnings !== 1 ? 's' : ''}`));
        console.log(`Found ${parts.join(' and ')}`);
    }
}
