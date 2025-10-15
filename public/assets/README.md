# �� Assets Directory

Estrutura de arquivos estáticos da aplicação.

## 📂 Estrutura
```
assets/
├── images/          # Imagens gerais da aplicação
│   ├── devices/     # Fotos de dispositivos IoT
│   ├── screenshots/ # Screenshots para documentação
│   └── backgrounds/ # Imagens de fundo
├── icons/           # Ícones da interface
│   ├── devices/     # Ícones de tipos de dispositivos
│   └── ui/          # Ícones de interface
└── logos/           # Logos e branding
    ├── company/     # Logo EasySmart
    └── partners/    # Logos de parceiros
```

## 📝 Convenções

### Nomenclatura
- Use kebab-case: `compressor-monitor.png`
- Inclua dimensões para variantes: `logo-512x512.png`
- Use prefixos para categorias: `icon-temperature.svg`

### Formatos Recomendados
- **Logos**: SVG (escalável) ou PNG com fundo transparente
- **Ícones**: SVG preferencial, PNG 32x32, 64x64, 128x128
- **Fotos**: JPG (otimizado) ou WebP
- **Screenshots**: PNG para qualidade

### Otimização
- Comprimir imagens antes de commit
- Usar ferramentas: TinyPNG, ImageOptim, Squoosh
- Target: < 100KB por imagem quando possível

## 🚫 .gitignore
Arquivos muito grandes (> 5MB) não devem ser commitados.
Use CDN ou external storage para assets grandes.
