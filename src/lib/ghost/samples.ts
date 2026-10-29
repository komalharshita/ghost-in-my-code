import type { Language, Report } from "./types";

export interface Sample { id: string; title: string; tag: string; difficulty: string; blurb: string; language: Language; code: string; demoReport: Report }

/** Bundled sample relics. `demoReport` is a hand-written, labeled DEMO report — never shown as AI output. */
export const SAMPLES: Sample[] = [
  {
    id: "py2-greeting",
    title: "The Forgotten Greeting",
    tag: "PYTHON 2",
    difficulty: "Beginner",
    blurb: "A greeting function still speaking Python 2's print statement.",
    language: "python",
    code: `def greet(name):
    print "Hello, " + name

greet("developer")`,
    demoReport: {
      summary: "This snippet defines a greeting function and calls it with the name `developer`. Its print statement uses Python 2 syntax and needs updating for Python 3.",
      language: "Python 2",
      key_concepts: ["function definition", "string concatenation", "print statement"],
      outdated_patterns: [
        { pattern: "Legacy print statement", explanation: "`print \"...\"` is a statement in Python 2 and a SyntaxError in Python 3.", modern_alternative: "print(\"Hello, \" + name) or an f-string" },
      ],
      potential_issues: [
        { issue: "Concatenation fails for non-string names", severity: "low", evidence: "\"Hello, \" + name raises TypeError if name is not a str." },
      ],
      modernized_code: `def greet(name: str) -> None:
    print(f"Hello, {name}")


greet("developer")`,
      changes: [
        { what: "print(...) function call", why: "Required by Python 3." },
        { what: "f-string instead of +", why: "Reads clearer and converts non-string values automatically." },
        { what: "Type hints", why: "Optional; documents the expected argument." },
      ],
      line_explanations: [
        { line: "1", code: "def greet(name):", explanation: "Defines a reusable function taking one argument." },
        { line: "2", code: 'print "Hello, " + name', explanation: "Python 2 print statement; joins two strings." },
        { line: "4", code: 'greet("developer")', explanation: "Calls the function, printing \"Hello, developer\"." },
      ],
      compatibility_notes: ["Requires revision for Python 3.", "The f-string version needs Python 3.6+."],
      ghost_diary: "I was written when print didn't need parentheses and nobody thought twice about it. I only know one trick: saying hello. I've greeted the same developer over and over, never knowing their real name. If you carry me into Python 3, wrap my words in parentheses — I promise I'll still be polite.",
      uncertainties: ["Whether callers ever pass non-string names.", "Static review only — the code was not executed."],
    },
  },
  {
    id: "js-callbacks",
    title: "Callback Afterlife",
    tag: "JAVASCRIPT",
    difficulty: "Intermediate",
    blurb: "Error-first callbacks nested inside each other.",
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
    title: "The Nested Loop",
    tag: "ALGORITHM",
    difficulty: "Intermediate",
    blurb: "A triple-nested duplicate finder in pre-generics Java.",
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
    title: "The Memory Echo",
    tag: "C / C++",
    difficulty: "Advanced",
    blurb: "gets, strcpy and a malloc that is never freed.",
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
