import { List, ActionPanel, Action, showFailureToast } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import * as cheerio from "cheerio";

interface Command {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
}

// Parses the raw HTML into an array of Command objects
function parseCommands(html: string): Command[] {
  const $ = cheerio.load(html);
  const commands: Command[] = [];

  $(".command-group").each((_, groupEl) => {
    const groupName = $(groupEl).find("h2").first().text().trim();

    $(groupEl)
      .find(".command-entry")
      .each((_, entryEl) => {
        const entry = $(entryEl);
        const a = entry.find("code a");
        const name = a.text().trim();
        const href = a.attr("href") ?? "";

        if (name && href) {
          let description = entry
            .clone()
            .children("code")
            .remove()
            .end()
            .text()
            .trim();

          // Strip wrapping quotes and collapse whitespace
          if (description.startsWith('"') && description.endsWith('"')) {
            description = description.slice(1, -1);
          }
          description = description.replace(/\s+/g, " ").trim();

          commands.push({ id: name, name, description, url: href, category: groupName });
        }
      });
  });

  if (commands.length === 0) {
    throw new Error("No commands found - page structure may have changed.");
  }

  return commands;
}

export default function CommandSearch() {
  const { isLoading, data: commands = [], revalidate } = useFetch<string, Command[], Command[]>(
    "https://valkey.io/commands/",
    {
      initialData: [],
      keepPreviousData: true,
      // First get raw HTML
      parseResponse: async (res) => res.text(),
      // then turn it into our Command[]
      mapResult: (html) => ({ data: parseCommands(html) }),
      onError: (error) => {
        showFailureToast(error, { title: "Failed to fetch commands" });
      },
      failureToastOptions: {
        title: "Fetch Error",
        message: "Unable to load Valkey commands.",
      },
    }
  );

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search Valkey commands..."
      actions={
        <ActionPanel>
          <Action title="Reload Commands" onAction={revalidate} />
        </ActionPanel>
      }
    >
      {commands.map((cmd) => (
        <List.Item
          key={cmd.id}
          title={cmd.name}
          subtitle={cmd.description}
          accessories={[{ text: cmd.category }]}
          keywords={[cmd.category]}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={cmd.url} title="Open in Browser" />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
