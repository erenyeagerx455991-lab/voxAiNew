import type { ComponentDef, PageLayout, SelectionResult, SelectorInput } from './types';
import { selectComponents } from './selector';
import { getComponentById } from './registry';

function buildAppFunction(layout: PageLayout): string {
  const allIds = [layout.navbar, ...layout.sections, layout.footer];
  const componentNames = allIds
    .map(id => {
      const c = getComponentById(id);
      if (!c) return null;
      return toPascalCase(id);
    })
    .filter(Boolean) as string[];

  const renders = componentNames.map(name => `      <${name} />`).join('\n');

  return `function App() {
  return (
    <div>
${renders}
    </div>
  );
}`;
}

function toPascalCase(id: string): string {
  return id
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function assemblePage(components: ComponentDef[], layout: PageLayout): string {
  const orderedIds = [layout.navbar, ...layout.sections, layout.footer];
  const orderedComponents = orderedIds
    .map(id => components.find(c => c.id === id))
    .filter(Boolean) as ComponentDef[];

  const componentCode = orderedComponents
    .map(c => c.standaloneCode.trim())
    .join('\n\n');

  const appFunction = buildAppFunction(layout);

  return `${componentCode}\n\n${appFunction}`;
}

export function assembleFromPrompt(input: SelectorInput): SelectionResult {
  const { layout, components } = selectComponents(input);
  const assembledCode = assemblePage(components, layout);
  return { layout, components, assembledCode };
}

export function getComponentCodeById(id: string): string | null {
  const c = getComponentById(id);
  return c ? c.standaloneCode : null;
}

export function getAssemblyManifest(components: ComponentDef[]): {
  totalComponents: number;
  categories: string[];
  ids: string[];
} {
  return {
    totalComponents: components.length,
    categories: [...new Set(components.map(c => c.category))],
    ids: components.map(c => c.id),
  };
}
