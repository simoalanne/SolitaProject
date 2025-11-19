import { useState } from 'react'
import "../../css/collapsible.css"
import { ChevronDown } from 'lucide-react'

type CollapsibleProps = {
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}

const Collapsible = ({ label, children, defaultOpen }: CollapsibleProps) => {
  const [open, setOpen] = useState(Boolean(defaultOpen))

  return (
    <div className="collapsible">
      <div className="header-row">
        <h5 className="label">{label}</h5>
        <button
          type="button"
          className="icon-button"
          onClick={() => setOpen(o => !o)}
        >
          <ChevronDown size={24} className={`chevron ${open ? "open" : ""}`} />
        </button>
      </div>

      <div className={`panel ${open ? 'open' : ''}`}>
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Collapsible;