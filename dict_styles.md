# MedAgenda Style Dictionary (`dict_styles.md`)

Este diccionario de estilos funciona como la **Única Fuente de Verdad** (Single Source of Truth) para todo el desarrollo frontend de MedAgenda (Web y Mobile). Traduce los valores de `DESIGN_SYSTEM.md` en tokens de diseño organizados.

---

## 1. Esquema de Colores (Color Tokens)

### 1.1 Colores de Marca (Brand Colors)
| Token Name | Hex Value | CSS Variable | Aplicación Principal |
| :--- | :--- | :--- | :--- |
| `color.brand.primary` | `#259487` | `--medagenda-primary` | Color primario (Teal). Botones primarios, acentos. |
| `color.brand.secondary` | `#4682B4` | `--medagenda-primary-hover` | Azul acero. Hover, destacados secundarios. |

### 1.2 Paleta Neutra (Neutral Palette)
| Token Name | Hex Value | CSS Variable | Equivalente Tailwind | Descripción / Uso |
| :--- | :--- | :--- | :--- | :--- |
| `color.neutral.bg` | `#ffffff` | `--medagenda-bg` | `white` | Fondo principal (Blanco puro). |
| `color.neutral.surface` | `#f9fafb` | `--medagenda-surface` | `gray-50` | Fondo secundario, listas, tablas. |
| `color.neutral.surface-muted` | `#f3f4f6` | `--medagenda-surface-muted`| `gray-100` | Fondos inactivos o widgets. |
| `color.neutral.border` | `#d1d5db` | `--medagenda-border` | `gray-300` | Bordes estándar, inputs. |
| `color.neutral.border-light` | `#e5e7eb` | `--medagenda-border-light`| `gray-200` | Bordes ligeros de tarjetas. |
| `color.neutral.text-main` | `#171717` | `--medagenda-text-main` | `gray-900` | Texto principal, títulos. |
| `color.neutral.text-muted` | `#4b5563` | `--medagenda-text-muted` | `gray-600` | Texto secundario, descripciones. |
| `color.neutral.text-light` | `#9ca3af` | `--medagenda-text-light` | `gray-400` | Texto inactivo, placeholders. |

### 1.3 Colores Semánticos y de Feedback (Semantic & Feedback)
* **Éxito (Success):** Mensajes de confirmación, turnos confirmados.
  - `color.semantic.success.bg`: `#ecfdf5` (Fondo) | `border`: `#a7f3d0` | `text`: `#065f46`
  - `color.semantic.success.badge-bg`: `#d1fae5` | `badge-text`: `#047857`
* **Error / Peligro (Error/Danger):** Cancelaciones, validaciones fallidas.
  - `color.semantic.error.bg`: `#fef2f2` | `border`: `#fecaca` | `text`: `#991b1b`
  - `color.semantic.error.badge-bg`: `#fee2e2` | `badge-text`: `#b91c1c`
* **Advertencia (Warning):** Advertencias, acciones con atención.
  - `color.semantic.warning.bg`: `#fffbeb` | `border`: `#fde68a` | `text`: `#92400e`
  - `color.semantic.warning.badge-bg`: `#fef3c7` | `badge-text`: `#b45309`
* **Información (Info):** Consejos e información general.
  - `color.semantic.info.bg`: `#eff6ff` | `border`: `#bfdbfe` | `text`: `#1e40af`
  - `color.semantic.info.badge-bg`: `#dbeafe` | `badge-text`: `#1d4ed8`
* **Insignias Especiales (Special Badges):**
  - **Cyan (General):** `bg`: `#cffafe` | `text`: `#0e7490`
  - **Purple (Especialidades):** `bg`: `#f3e8ff` | `text`: `#7e22ce`

---

## 2. Tipografía (Typography Tokens)

### 2.1 Fuentes (Font Family)
* **`font.family.main`**: `Arial, Helvetica, sans-serif`  
  *Nota:* Lectura nítida y ágil de datos clínicos en cualquier resolución.

### 2.2 Tamaños (Font Sizes)
| Token Name | Value (px) | Value (rem) | Ejemplo de Aplicación |
| :--- | :--- | :--- | :--- |
| `font.size.xs` | `12px` | `0.75rem` | Insignias, hora o subtexto de turnos. |
| `font.size.sm` | `14px` | `0.875rem` | Etiquetas de formulario, botones, subtítulos. |
| `font.size.base`| `16px` | `1rem` | Texto de cuerpo principal, campos de entrada. |
| `font.size.lg` | `18px` | `1.125rem` | Subtítulos intermedios, títulos secundarios. |
| `font.size.xl` | `20px` | `1.25rem` | Títulos en tarjetas principales. |
| `font.size.2xl`| `24px` | `1.5rem` | Títulos de pantallas de control y secciones. |

### 2.3 Pesos (Font Weights)
* `font.weight.normal`: `400` (Cuerpo principal, contenido largo)
* `font.weight.medium`: `500` (Campos de entrada, botones primarios, etiquetas)
* `font.weight.semibold`: `600` (Subtítulos destacados, badges de estado)
* `font.weight.bold`: `700` (Títulos de pantallas y secciones principales)

---

## 3. Estructura y Layout (Structure & Layout Tokens)

### 3.1 Espaciado (Escala de 4px)
* **`spacing.xxs`** (4px / `0.25rem`): Espacio icono-texto, padding interno mínimo.
* **`spacing.xs`** (8px / `0.5rem`): Padding vertical de botones y campos de entrada.
* **`spacing.sm`** (12px / `0.75rem`): Padding horizontal de inputs, separación de campos.
* **`spacing.md`** (16px / `1rem`): Padding interno de tarjetas, separación entre módulos.
* **`spacing.lg`** (24px / `1.5rem`): Margen exterior de pantallas, distancia entre bloques.
* **`spacing.xl`** (32px / `2rem`): Espacio amplio (pantallas de bienvenida/login).

### 3.2 Bordes y Radios
* `border.radius.sm` (4px): Bordes de alertas internas compactas.
* `border.radius.md` (6px): Bordes de botones e inputs (`.medagenda-input`).
* `border.radius.lg` (8px): Esquinas de tarjetas principales (`.medagenda-card`).
* `border.radius.full` (9999px): Bordes redondos de badges (`.medagenda-badge`).

### 3.3 Sombras (Shadows)
* `shadow.sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (Tarjetas básicas e inputs).
* `shadow.md`: `0 4px 6px -1px rgba(0, 0, 0, 0.1)` (Modales, desplegables, alertas críticas).
