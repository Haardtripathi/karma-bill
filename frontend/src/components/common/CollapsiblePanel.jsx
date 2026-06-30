import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils.js";

export default function CollapsiblePanel({
  title,
  description = "",
  summary = "",
  actions = null,
  children,
  defaultOpen = true,
  className = "",
  contentClassName = "",
  headingLevel = 3
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  const HeadingTag = `h${headingLevel}`;

  return (
    <section className={cn("collapsible-panel", !open && "is-collapsed", className)}>
      <div className="collapsible-panel-head">
        <button
          type="button"
          className="collapsible-trigger"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((current) => !current)}
        >
          <ChevronDown className="collapsible-chevron" size={17} aria-hidden="true" />
          <span className="collapsible-title-stack">
            <HeadingTag>{title}</HeadingTag>
            {description ? <span>{description}</span> : null}
          </span>
        </button>
        {(summary || actions) && (
          <div className="collapsible-head-meta">
            {summary ? <span className="collapsible-summary">{summary}</span> : null}
            {actions ? <div className="collapsible-actions">{actions}</div> : null}
          </div>
        )}
      </div>
      {open && (
        <div id={contentId} className={cn("collapsible-content", contentClassName)}>
          {children}
        </div>
      )}
    </section>
  );
}
