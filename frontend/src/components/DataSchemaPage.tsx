const columnGroups: { title: string; columns: [string, string][] }[] = [
  {
    title: "Order details",
    columns: [
      ["order_id", "The unique identifier for a customer order. One order can include several products."],
      ["order_date", "The date the order was placed. Used for all trend, year, and month questions."],
      ["order_status", "Where the order stands today: Processing, Completed, Cancelled, or Returned."],
    ],
  },
  {
    title: "Product & revenue",
    columns: [
      ["product_name", "The name of the product on a given order line."],
      ["category", "The product's category: Electronics, Furniture, or Accessories."],
      ["price", "The unit price of the product at the time it was sold."],
      ["quantity", "How many units of the product were purchased on that line."],
      ["line_item_revenue", "Revenue for that line item (price × quantity). This is the source of truth for all revenue figures."],
    ],
  },
  {
    title: "Customer details",
    columns: [
      ["customer_id", "The unique identifier for the customer who placed the order."],
      ["first_name", "The customer's first name."],
      ["segment", "The customer's business segment: Enterprise, Mid-Market, or SMB."],
      ["region", "The customer's geographic region: North America, Europe, Asia, or LATAM."],
      ["signup_date", "The date the customer first signed up."],
    ],
  },
];

const exampleCategories: { title: string; examples: string[] }[] = [
  {
    title: "Revenue & growth",
    examples: [
      "What's our total revenue this year?",
      "What's the year-over-year revenue growth?",
      "Show a chart of monthly revenue for 2025.",
    ],
  },
  {
    title: "Product performance",
    examples: ["What are the top 5 categories by revenue?", "Which category has the highest average order value?"],
  },
  {
    title: "Customers & regions",
    examples: ["How does revenue break down by customer segment?", "Which region generates the most revenue?"],
  },
  {
    title: "Order health",
    examples: ["What percentage of orders are cancelled or returned?", "How many orders are currently in Processing status?"],
  },
];

export function DataSchemaPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">About the data</p>
        <h2 className="font-display mt-1.5 text-2xl font-semibold tracking-tight text-stone-950 dark:text-white">
          A single table of e-commerce orders
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          Every answer in this chatbot comes from one dataset: a table of e-commerce order line items, called{" "}
          <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-200">
            obt_orders
          </code>
          . Each row represents one product on one order — so an order with three products appears as three rows,
          all sharing the same <code className="rounded bg-stone-100 px-1 py-0.5 text-xs dark:bg-stone-800">order_id</code>.
          It combines order, product, and customer information in one place so questions can be answered without
          needing to know how the underlying systems are joined together.
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">Columns available</h3>
        <div className="mt-4 space-y-6">
          {columnGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-sm font-semibold text-stone-800 dark:text-stone-100">{group.title}</p>
              <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
                {group.columns.map(([name, description], i) => (
                  <div
                    key={name}
                    className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-4 ${
                      i % 2 === 0 ? "bg-white dark:bg-stone-900" : "bg-stone-50/70 dark:bg-stone-800/40"
                    }`}
                  >
                    <code className="shrink-0 text-xs font-semibold text-amber-700 sm:w-40 dark:text-amber-400">{name}</code>
                    <p className="text-sm text-stone-600 dark:text-stone-300">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
          Questions that provide real business value
        </h3>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
          A few starting points — try asking these directly in the Chat tab, or rephrase them in your own words.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {exampleCategories.map((group) => (
            <div key={group.title} className="rounded-xl border border-stone-200 p-4 dark:border-stone-800">
              <p className="mb-2 text-sm font-semibold text-stone-800 dark:text-stone-100">{group.title}</p>
              <ul className="space-y-1.5 text-sm text-stone-600 dark:text-stone-300">
                {group.examples.map((example) => (
                  <li key={example} className="leading-snug">
                    “{example}”
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
