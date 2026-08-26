import glob, os

files = glob.glob('d:/Projects/React/Beam/Development/Beam2.o_South_Incidents/src/modules/incident-management/**/*.jsx', recursive=True)
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if '"mod-btn-primary"' in content:
        content = content.replace('"mod-btn-primary"', '"mod-btn-primary im-btn-primary"')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
            
css_file = 'd:/Projects/React/Beam/Development/Beam2.o_South_Incidents/src/styles/module-shared.css'
with open(css_file, 'a', encoding='utf-8') as file:
    file.write("\n\n/* Incident Management Specific Primary Button Override */\n.im-btn-primary {\n  background: #111827 !important;\n  color: #fff !important;\n}\n\n.im-btn-primary:hover {\n  background: #1f2937 !important;\n}\n")
