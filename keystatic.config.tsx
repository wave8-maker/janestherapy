import { config, fields, collection, singleton } from "@keystatic/core";

export default config({
  storage: process.env.KEYSTATIC_GITHUB_CLIENT_ID
    ? {
        kind: "github" as const,
        repo: { owner: "wave8-maker", name: "janestherapy" },
        branchPrefix: "keystatic/",
      }
    : { kind: "local" as const },

  ui: {
    brand: { name: "Jane's Therapy" },
    navigation: {
      "Site Settings": ["settings"],
      Services: ["services", "addons"],
      Blog: ["posts"],
    },
  },

  singletons: {
    settings: singleton({
      label: "📢 Announcement & Hours",
      path: "content/siteConfig",
      format: { data: "json" },
      schema: {
        announcement: fields.text({
          label: "Announcement Banner",
          description: "Shown at the top of every page. Leave blank to hide.",
          multiline: true,
        }),
        hours: fields.array(
          fields.object({
            day: fields.text({ label: "Day" }),
            time: fields.text({
              label: 'Hours (e.g. "9:30 AM – 8:30 PM" or "Closed")',
            }),
          }),
          {
            label: "Business Hours",
            itemLabel: (props) => props.fields.day.value || "Day",
          }
        ),
      },
    }),

    services: singleton({
      label: "💆 Services",
      path: "content/services",
      format: { data: "json" },
      schema: {
        items: fields.array(
          fields.object({
            name: fields.text({ label: "Service Name" }),
            badge: fields.text({ label: "Badge (optional, e.g. Signature 👍)" }),
            description: fields.text({ label: "Description", multiline: true }),
            pricing: fields.array(
              fields.object({
                duration: fields.text({ label: "Duration (e.g. 60 minutes)" }),
                price: fields.text({ label: "Price (e.g. $120)" }),
              }),
              {
                label: "Pricing",
                itemLabel: (props) =>
                  `${props.fields.duration.value} — ${props.fields.price.value}`,
              }
            ),
            details: fields.array(fields.text({ label: "Detail" }), {
              label: "Extra Details (optional)",
            }),
          }),
          {
            label: "Services",
            itemLabel: (props) => props.fields.name.value || "Service",
          }
        ),
      },
    }),

    addons: singleton({
      label: "✨ Add-ons",
      path: "content/addons",
      format: { data: "json" },
      schema: {
        items: fields.array(
          fields.object({
            name: fields.text({ label: "Add-on Name" }),
            description: fields.text({ label: "Description", multiline: true }),
            pricing: fields.array(
              fields.object({
                duration: fields.text({ label: "Duration (leave blank if none)" }),
                price: fields.text({ label: "Price (e.g. $30)" }),
              }),
              {
                label: "Pricing",
                itemLabel: (props) => props.fields.price.value || "Price",
              }
            ),
          }),
          {
            label: "Add-ons",
            itemLabel: (props) => props.fields.name.value || "Add-on",
          }
        ),
      },
    }),
  },

  collections: {
    posts: collection({
      label: "📝 Blog Posts",
      slugField: "title",
      path: "content/blog/*",
      format: { contentField: "content" },
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        date: fields.date({ label: "Date" }),
        excerpt: fields.text({ label: "Excerpt (shown on blog list)", multiline: true }),
        content: fields.text({ label: "Content (Markdown supported)", multiline: true }),
      },
    }),
  },
});
