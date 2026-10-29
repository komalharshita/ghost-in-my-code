import type { Language, Report } from "./types";

export interface Sample { id: string; title: string; blurb: string; language: Language; code: string; demoReport: Report }

/** Bundled sample relics. `demoReport` is a hand-written, labeled DEMO report — never shown as AI output. */
export const SAMPLES: Sample[] = [
  {
    id: "py2-inventory",
    title: "Python 2 inventory script",
    blurb: "print statements, xrange, has_key",
    language: "python",
    code: `# inventory.py
stock = {"apple": 3, "pear": 0}

def report(items):
    for i in xrange(len(items.keys())):
        name = items.keys()[i]
        if items.has_key(name) and items[name] > 0:
            print "%s: %d in stock" % (name, items[name])
        else:
            print name + " is sold out"

try:
    report(stock)
except KeyError, e:
    print "missing", e`,
    demoReport: {
      summary: "Prints each item in a stock dictionary, showing the count if positive and 'sold out' otherwise. It is written in Python 2 syntax and will not run on Python 3.",
      language: "Python 2",
      key_concepts: ["dict iteration", "index-based loop", "string formatting", "exception handling"],
      outdated_patterns: [
        { pattern: "print statement", explanation: "`print x` is a statement in Python 2 only.", modern_alternative: "print(x)" },
        { pattern: "xrange / keys()[i]", explanation: "Indexing into keys() relies on Python 2 returning a list.", modern_alternative: "for name, count in items.items():" },
        { pattern: "dict.has_key", explanation: "Removed in Python 3.", modern_alternative: "`name in items`" },
        { pattern: "except KeyError, e", explanation: "Python 2 exception syntax.", modern_alternative: "except KeyError as e:" },
      ],
      potential_issues: [
        { issue: "has_key check is redundant", severity: "low", evidence: "name comes from items.keys(), so it is always present." },
        { issue: "KeyError handler is effectively unreachable", severity: "low", evidence: "No lookup uses a key that is not already in the dict." },
      ],
      modernized_code: `# inventory.py
stock = {"apple": 3, "pear": 0}

def report(items: dict[str, int]) -> None:
    for name, count in items.items():
        if count > 0:
            print(f"{name}: {count} in stock")
        else:
            print(f"{name} is sold out")

if __name__ == "__main__":
    report(stock)`,
      changes: [
        { what: "Iterate with items()", why: "Clearer and works in Python 3, where keys() is a view." },
        { what: "f-strings instead of % and +", why: "More readable; same output text." },
        { what: "Dropped the try/except", why: "The KeyError could not occur; remove only if you agree." },
      ],
      line_explanations: [
        { line: "5", code: "for i in xrange(len(items.keys())):", explanation: "Loops over indices rather than items — an older idiom." },
        { line: "8", code: 'print "%s: %d in stock" % (...)', explanation: "Python 2 print with %-formatting." },
        { line: "14", code: "except KeyError, e:", explanation: "Python 2-only syntax; a SyntaxError in Python 3." },
      ],
      compatibility_notes: ["Modernized version requires Python 3.9+ for the dict[str, int] annotation.", "Dict ordering is insertion order on 3.7+; Python 2 order was arbitrary."],
      ghost_diary: "I was written when print didn't need parentheses and nobody questioned it. I counted apples one index at a time, because that's how they taught me. I guarded against a KeyError that never came — a small superstition. If you're moving me to Python 3, be gentle: I only ever wanted to tell you what was left on the shelf.",
      uncertainties: ["Whether other modules rely on the exact output format.", "Whether the dead except block was intentional."],
    },
  },
  {
    id: "js-callbacks",
    title: "Callback pyramid (Node.js)",
    blurb: "var, error-first callbacks, nesting",
    language: "javascript",
    code: `var fs = require('fs');

function loadConfig(path, cb) {
  fs.readFile(path, 'utf8', function (err, data) {
    if (err) return cb(err);
    var cfg = JSON.parse(data);
    fs.readFile(cfg.secondary, 'utf8', function (err, extra) {
      if (err) return cb(err);
      cfg.extra = extra;
      if (cfg.debug == true) console.log('loaded', cfg);
      cb(null, cfg);
    });
  });
}`,
    demoReport: {
      summary: "Reads a JSON config file, then reads a second file named inside it, attaches its contents as `extra`, and returns the result via a callback.",
      language: "JavaScript (Node.js, CommonJS)",
      key_concepts: ["error-first callbacks", "nested async I/O", "JSON parsing"],
      outdated_patterns: [
        { pattern: "Nested callbacks", explanation: "Each dependent read adds a nesting level.", modern_alternative: "fs/promises with async/await" },
        { pattern: "var", explanation: "Function-scoped and hoisted.", modern_alternative: "const / let" },
        { pattern: "== true", explanation: "Loose equality coerces types.", modern_alternative: "cfg.debug === true or just cfg.debug" },
      ],
      potential_issues: [
        { issue: "JSON.parse can throw synchronously", severity: "medium", evidence: "A malformed file throws inside the callback instead of reaching cb(err)." },
        { issue: "Secondary path is not validated", severity: "low", evidence: "cfg.secondary is used directly as a file path." },
      ],
      modernized_code: `import { readFile } from 'node:fs/promises';

export async function loadConfig(path) {
  const cfg = JSON.parse(await readFile(path, 'utf8'));
  cfg.extra = await readFile(cfg.secondary, 'utf8');
  if (cfg.debug === true) console.log('loaded', cfg);
  return cfg;
}`,
      changes: [
        { what: "async/await with fs/promises", why: "Flattens the nesting; errors (including JSON.parse) become rejections." },
        { what: "ES module syntax", why: "Modern default; switch back to require if the project is CommonJS." },
        { what: "Returns a Promise instead of taking cb", why: "Callers must be updated — this is an API change." },
      ],
      line_explanations: [
        { line: "4", code: "fs.readFile(path, 'utf8', function (err, data) {", explanation: "Starts the first asynchronous read." },
        { line: "6", code: "var cfg = JSON.parse(data);", explanation: "Can throw; not routed to cb." },
        { line: "10", code: "if (cfg.debug == true)", explanation: "Loose comparison; 1 or '1' also pass." },
      ],
      compatibility_notes: ["Requires Node 14+ for node:fs/promises.", "Changing to a Promise-based API breaks existing callback callers."],
      ghost_diary: "I come from the days of callbacks within callbacks, when every file was a promise nobody wrote down. I nest because I wait — first for one file, then another. I log when debug is 'true-ish', which was close enough back then. Flatten me if you must, but remember that someone still calls me with a function.",
      uncertainties: ["Whether loose equality on cfg.debug is relied upon (e.g. debug: 1).", "Whether the project uses ES modules."],
    },
  },
  {
    id: "nested-loops",
    title: "Triple-nested duplicate finder",
    blurb: "confusing O(n³) loops in Java",
    language: "java",
    code: `import java.util.*;

public class Dupes {
    public static Vector findDupes(int[] a) {
        Vector out = new Vector();
        for (int i = 0; i < a.length; i++) {
            for (int j = 0; j < a.length; j++) {
                if (i != j && a[i] == a[j]) {
                    boolean seen = false;
                    for (int k = 0; k < out.size(); k++) {
                        if (((Integer) out.get(k)).intValue() == a[i]) seen = true;
                    }
                    if (!seen) out.add(new Integer(a[i]));
                }
            }
        }
        return out;
    }
}`,
    demoReport: {
      summary: "Returns each integer that appears more than once in the array, in order of first detection, using three nested loops.",
      language: "Java (pre-generics style)",
      key_concepts: ["nested loops", "duplicate detection", "boxing/unboxing"],
      outdated_patterns: [
        { pattern: "Raw Vector", explanation: "Synchronized legacy collection without type parameters.", modern_alternative: "List<Integer> / Set<Integer>" },
        { pattern: "new Integer(...)", explanation: "Deprecated since Java 9.", modern_alternative: "Integer.valueOf or autoboxing" },
        { pattern: "Manual casting", explanation: "Needed only because of raw types.", modern_alternative: "Generics" },
      ],
      potential_issues: [
        { issue: "Cubic worst-case time", severity: "medium", evidence: "Loops over i, j and the output list; slow on large arrays." },
        { issue: "Inner loop does not break after finding a match", severity: "low", evidence: "`seen = true` keeps scanning." },
      ],
      modernized_code: `import java.util.*;

public class Dupes {
    public static List<Integer> findDupes(int[] a) {
        Set<Integer> seen = new HashSet<>();
        Set<Integer> dupes = new LinkedHashSet<>();
        for (int x : a) {
            if (!seen.add(x)) dupes.add(x);
        }
        return new ArrayList<>(dupes);
    }
}`,
      changes: [
        { what: "HashSet-based single pass", why: "Roughly linear time instead of cubic." },
        { what: "Return List<Integer>", why: "Type-safe; callers expecting Vector must change." },
        { what: "Order is by second occurrence", why: "The original ordered by first index i with a later match — results may differ in order." },
      ],
      line_explanations: [
        { line: "7", code: "for (int j = 0; j < a.length; j++)", explanation: "Compares every pair twice (i,j) and (j,i)." },
        { line: "10", code: "for (int k = 0; k < out.size(); k++)", explanation: "Linear search to avoid adding the same duplicate twice." },
        { line: "13", code: "out.add(new Integer(a[i]));", explanation: "Deprecated boxing constructor." },
      ],
      compatibility_notes: ["Return type changed from Vector to List.", "Element order of the result may differ from the original."],
      ghost_diary: "Before Sets were fashionable, I compared everyone with everyone, then checked my notebook to be sure. Three loops deep, I never hurried. I was correct, just tired. If you replace me with a HashSet, I won't be offended — but do check the order I returned things in; somebody may have depended on it.",
      uncertainties: ["Whether callers depend on the Vector type or result ordering.", "Typical input size — the speedup only matters for large arrays."],
    },
  },
  {
    id: "c-strings",
    title: "C string greeter",
    blurb: "gets, strcpy, malloc without free",
    language: "c",
    code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *greet(char *name) {
    char *buf = malloc(32);
    strcpy(buf, "Hello, ");
    strcat(buf, name);
    return buf;
}

int main() {
    char name[16];
    gets(name);
    printf(greet(name));
    return 0;
}`,
    demoReport: {
      summary: "Reads a name from standard input, builds the string 'Hello, <name>' in a heap buffer, and prints it.",
      language: "C",
      key_concepts: ["heap allocation", "C strings", "standard input"],
      outdated_patterns: [
        { pattern: "gets()", explanation: "Removed in C11; cannot limit input length.", modern_alternative: "fgets(name, sizeof name, stdin)" },
        { pattern: "strcpy/strcat", explanation: "No bounds checking.", modern_alternative: "snprintf with an explicit size" },
      ],
      potential_issues: [
        { issue: "Buffer overflow via gets", severity: "high", evidence: "name is 16 bytes; gets writes unbounded input." },
        { issue: "Format-string vulnerability", severity: "high", evidence: "printf(greet(name)) uses user data as the format string." },
        { issue: "Memory leak and unchecked malloc", severity: "medium", evidence: "The buffer is never freed and NULL is not checked." },
      ],
      modernized_code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *greet(const char *name) {
    size_t len = strlen("Hello, ") + strlen(name) + 1;
    char *buf = malloc(len);
    if (!buf) return NULL;
    snprintf(buf, len, "Hello, %s", name);
    return buf;
}

int main(void) {
    char name[16];
    if (!fgets(name, sizeof name, stdin)) return 1;
    name[strcspn(name, "\\n")] = '\\0';
    char *msg = greet(name);
    if (!msg) return 1;
    printf("%s\\n", msg);
    free(msg);
    return 0;
}`,
      changes: [
        { what: "fgets instead of gets", why: "Bounded input; strips the trailing newline." },
        { what: "Size buffer exactly and use snprintf", why: "Prevents overflow in greet." },
        { what: 'printf("%s\\n", msg)', why: "Removes the format-string vulnerability; adds a newline." },
        { what: "free(msg) and NULL checks", why: "Fixes the leak and handles allocation failure." },
      ],
      line_explanations: [
        { line: "6", code: "char *buf = malloc(32);", explanation: "Fixed 32 bytes regardless of name length." },
        { line: "14", code: "gets(name);", explanation: "Unbounded read into a 16-byte array." },
        { line: "15", code: "printf(greet(name));", explanation: "User text becomes the format string; also leaks the buffer." },
      ],
      compatibility_notes: ["Output now ends with a newline.", "Names longer than 14 characters are truncated by fgets."],
      ghost_diary: "I trusted everyone. Whatever you typed, I copied, no questions asked. I borrowed memory and never gave it back — nobody told me it was a loan. I printed your name as if it were my instructions. If you're reading me now, please be kinder to the next program than I was to my stack.",
      uncertainties: ["Static review only — the code was not compiled or run.", "Whether the program targets a pre-C11 compiler."],
    },
  },
];
