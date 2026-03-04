import os

modules = [
    'auth', 'users', 'organizations', 'programs', 
    'enrollments', 'payments', 'webhooks', 'certificates'
]

base_dir = 'src/modules'

app_module_imports = []
app_module_components = []

for mod in modules:
    mod_dir = os.path.join(base_dir, mod)
    os.makedirs(mod_dir, exist_ok=True)
    
    cap_name = mod.capitalize()
    
    # module file
    with open(os.path.join(mod_dir, f'{mod}.module.ts'), 'w') as f:
        f.write(f'''import {{ Module }} from '@nestjs/common';
import {{ {cap_name}Controller }} from './{mod}.controller';
import {{ {cap_name}Service }} from './{mod}.service';

@Module({{
  controllers: [{cap_name}Controller],
  providers: [{cap_name}Service],
}})
export class {cap_name}Module {{}}
''')
        
    # controller file
    with open(os.path.join(mod_dir, f'{mod}.controller.ts'), 'w') as f:
        f.write(f'''import {{ Controller }} from '@nestjs/common';
import {{ {cap_name}Service }} from './{mod}.service';

@Controller('{mod}')
export class {cap_name}Controller {{
  constructor(private readonly {mod}Service: {cap_name}Service) {{}}
}}
''')

    # service file
    with open(os.path.join(mod_dir, f'{mod}.service.ts'), 'w') as f:
        f.write(f'''import {{ Injectable }} from '@nestjs/common';

@Injectable()
export class {cap_name}Service {{}}
''')

    app_module_imports.append(f"import {{ {cap_name}Module }} from './modules/{mod}/{mod}.module';")
    app_module_components.append(f"    {cap_name}Module,")

# Update app.module.ts
app_module_path = 'src/app.module.ts'

app_content = f'''import {{ Module }} from '@nestjs/common';
import {{ AppController }} from './app.controller';
import {{ AppService }} from './app.service';
{chr(10).join(app_module_imports)}

@Module({{
  imports: [
{chr(10).join(app_module_components)}
  ],
  controllers: [AppController],
  providers: [AppService],
}})
export class AppModule {{}}
'''

with open(app_module_path, 'w') as f:
    f.write(app_content)

print("Scaffolding complete.")
