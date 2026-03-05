const fs = require('fs');
const path = require('path');

const modules = [
    'auth', 'users', 'organizations', 'programs',
    'enrollments', 'payments', 'webhooks', 'certificates'
];

const baseDir = path.join(__dirname, 'src', 'modules');

for (const mod of modules) {
    const modDir = path.join(baseDir, mod);
    if (!fs.existsSync(modDir)) {
        fs.mkdirSync(modDir, { recursive: true });
    }

    const capName = mod.charAt(0).toUpperCase() + mod.slice(1);

    // Create module file
    fs.writeFileSync(path.join(modDir, `${mod}.module.ts`), `import { Module } from '@nestjs/common';
import { ${capName}Controller } from './${mod}.controller';
import { ${capName}Service } from './${mod}.service';

@Module({
  controllers: [${capName}Controller],
  providers: [${capName}Service],
})
export class ${capName}Module {}`);

    // Create controller file
    fs.writeFileSync(path.join(modDir, `${mod}.controller.ts`), `import { Controller } from '@nestjs/common';
import { ${capName}Service } from './${mod}.service';

@Controller('${mod}')
export class ${capName}Controller {
  constructor(private readonly ${mod}Service: ${capName}Service) {}
}`);

    // Create service file
    fs.writeFileSync(path.join(modDir, `${mod}.service.ts`), `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${capName}Service {}`);

}

console.log('Successfully generated NestJS structural files.');
