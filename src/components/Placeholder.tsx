import { PageHeader } from './AppShell';
import { EmptyPlaceholder } from './ui';

export function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <EmptyPlaceholder
        title="Not built in this pass"
        body={`${title} isn't part of the Capital Call Creation & Execution challenge this prototype focuses on. It's kept in the navigation because it's a real part of Bunch's product surface, but the screen itself is out of scope here — see the redesign vision doc, §9, for the explicit scope line.`}
      />
    </div>
  );
}
