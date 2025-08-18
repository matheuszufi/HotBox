# Logos do HotBox

Esta pasta contém as logos oficiais do projeto HotBox.

## Arquivos disponíveis:

### 1. Logo Principal
- **hotbox-logo.svg** - Logo completo com texto "HotBox"
- Uso: Header, telas de login, documentação
- Formato: SVG (escalável)

### 2. Logo Icon
- **hotbox-icon.svg** - Apenas o ícone da caixa de comida
- Uso: Favicon, ícones pequenos, aplicativos móveis
- Formato: SVG (escalável)

## Como usar no React:

```tsx
// Importar as logos
import HotBoxLogo from '../assets/images/hotbox-logo.svg';
import HotBoxIcon from '../assets/images/hotbox-icon.svg';

// Usar nos componentes
function Header() {
  return (
    <img 
      src={HotBoxLogo} 
      alt="HotBox" 
      className="h-8" 
    />
  );
}

function Favicon() {
  return (
    <img 
      src={HotBoxIcon} 
      alt="HotBox Icon" 
      className="w-6 h-6" 
    />
  );
}
```

## Especificações técnicas:

- **Cores principais:**
  - Vermelho: #E53E3E (primary)
  - Laranja: #FF8C00 (secondary)
  - Branco: #FFFFFF (detalhes)

- **Formatos:**
  - SVG para web (recomendado)
  - PNG disponível sob demanda

- **Tamanhos recomendados:**
  - Header: 32px altura
  - Favicon: 16px, 32px, 48px
  - Mobile: 24px, 32px
