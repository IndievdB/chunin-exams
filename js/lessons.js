/* Academy curriculum: Python fundamentals, taught by Iruka-sensei.
   Each problem has Iruka's dialogue, the task, starter code, and a Python `check`
   that runs in the student's namespace after their code. In `check`:
     - the student's variables are in scope
     - `_out` is everything they printed
     - raise AssertionError("message") to fail; finishing cleanly passes. */
window.LESSONS = [
  {
    id: "variables", title: "Variables & Types", kanji: "変",
    intro: "Every jutsu starts with the basics. In Python, a variable is a name you attach to a value — a number, some text, true or false. No declarations, no ceremony.",
    problems: [
      { id: "var-1", title: "Name tag",
        say: "Let's start simple. Make a variable called name holding your shinobi name as text, and print it.",
        task: "Create a variable `name` containing a string, then print it.",
        starter: "name = \n",
        check: "assert 'name' in dir(), 'Make a variable called name.'\nassert isinstance(name, str), 'name should be a string (text in quotes).'\nassert name.strip() in _out, 'Print the value of name.'" },
      { id: "var-2", title: "Three types",
        say: "Python has a few primitive types: int for whole numbers, float for decimals, bool for True/False, str for text. Show me one of each.",
        task: "Create `age` (an int), `height` (a float), `is_genin` (a bool) and `village` (a str).",
        starter: "age = \nheight = \nis_genin = \nvillage = \n",
        check: "for n in ['age','height','is_genin','village']: assert n in dir(), f'Missing variable {n}.'\nassert type(age) is int, 'age should be an int.'\nassert type(height) is float, 'height should be a float, e.g. 1.5'\nassert type(is_genin) is bool, 'is_genin should be True or False.'\nassert type(village) is str, 'village should be a string.'" },
      { id: "var-3", title: "Arithmetic",
        say: "Chakra control is arithmetic. Given these two numbers, print their sum, their product, and the first divided by the second.",
        task: "Using `a` and `b`, print `a + b`, then `a * b`, then `a / b`, each on its own line.",
        starter: "a = 12\nb = 5\n",
        check: "lines = [l.strip() for l in _out.strip().splitlines()]\nassert lines[:3] == ['17', '60', '2.4'], f'Expected 17, 60 and 2.4 on three lines, got {lines[:3]}'" }
    ]
  },
  {
    id: "lists", title: "Lists (Arrays)", kanji: "列",
    intro: "A list holds many values in order. Index from zero: the first item is [0], the third is [2]. Append to grow it.",
    problems: [
      { id: "list-1", title: "Five strings",
        say: "Create a list, add five strings of your choosing, and print the third one. Remember: counting starts at zero.",
        task: "Make a list `items` with five strings, then print the third item.",
        starter: "items = []\n",
        check: "assert 'items' in dir() and isinstance(items, list), 'Make a list called items.'\nassert len(items) == 5, f'items should have 5 entries, it has {len(items)}.'\nassert all(isinstance(x, str) for x in items), 'All five entries should be strings.'\nassert _out.strip() == items[2], f'Print the third item: {items[2]!r}'" },
      { id: "list-2", title: "Append and length",
        say: "Start with this squad and add two more names with append. Then print how many there are.",
        task: "Append two names to `squad`, then print `len(squad)`.",
        starter: "squad = ['Naruto', 'Sasuke', 'Sakura']\n",
        check: "assert len(squad) == 5, 'squad should end up with 5 names.'\nassert _out.strip().endswith('5'), 'Print the length of squad (5).'" },
      { id: "list-3", title: "Slice the middle",
        say: "Slicing takes a range: ranks[1:4] is items 1, 2 and 3. Give me the middle three.",
        task: "Print the slice of `ranks` from index 1 up to (not including) 4.",
        starter: "ranks = ['Genin', 'Chunin', 'Jonin', 'Anbu', 'Kage']\n",
        check: "assert \"['Chunin', 'Jonin', 'Anbu']\" in _out, \"Print ranks[1:4], which is ['Chunin', 'Jonin', 'Anbu']\"" }
    ]
  },
  {
    id: "forloops", title: "For Loops", kanji: "繰",
    intro: "A for loop repeats a block once for each item in a sequence. range(n) counts from 0 to n-1.",
    problems: [
      { id: "for-1", title: "Roll call",
        say: "Print every name in the class, one per line. A for loop will do it in two lines.",
        task: "Loop over `students` and print each one.",
        starter: "students = ['Naruto', 'Hinata', 'Shikamaru', 'Choji']\n",
        check: "lines = [l.strip() for l in _out.strip().splitlines()]\nassert lines == students, f'Print each student on its own line. Got {lines}'" },
      { id: "for-2", title: "Count laps",
        say: "Guy-sensei runs laps. Use range to print the numbers 1 to 10.",
        task: "Print the numbers 1 through 10, one per line, using `range`.",
        starter: "",
        check: "lines = [l.strip() for l in _out.strip().splitlines()]\nassert lines == [str(i) for i in range(1, 11)], f'Expected 1..10 on separate lines, got {lines}'" },
      { id: "for-3", title: "Sum of a list",
        say: "Add up every mission reward with a loop. Keep a running total and print it at the end. No sum() shortcuts — show me the loop.",
        task: "Loop over `rewards`, accumulate a `total`, then print it.",
        starter: "rewards = [5000, 3000, 30000, 150000]\ntotal = 0\n",
        check: "assert 'for' in _src, 'Use a for loop for this one.'\nassert 'sum(' not in _src, 'No sum() this time — use the loop.'\nassert total == 188000, f'total should be 188000, got {total}'\nassert '188000' in _out, 'Print the total.'" }
    ]
  },
  {
    id: "whileloops", title: "While Loops", kanji: "限",
    intro: "A while loop repeats as long as a condition is true. Change something inside, or it runs forever.",
    problems: [
      { id: "while-1", title: "Countdown",
        say: "Count down from 5 to 1 with a while loop, then print 'Go!'.",
        task: "Use `while` to print 5, 4, 3, 2, 1 then `Go!`.",
        starter: "n = 5\n",
        check: "assert 'while' in _src, 'Use a while loop.'\nlines = [l.strip() for l in _out.strip().splitlines()]\nassert lines == ['5','4','3','2','1','Go!'], f'Expected 5..1 then Go!, got {lines}'" },
      { id: "while-2", title: "Doubling chakra",
        say: "Start with 1 unit of chakra. Keep doubling it while it's below 1000, counting how many doublings it takes. Print the count.",
        task: "Double `chakra` until it is at least 1000; print how many doublings that took.",
        starter: "chakra = 1\ndoublings = 0\n",
        check: "assert 'while' in _src, 'Use a while loop.'\nassert doublings == 10, f'It takes 10 doublings, you got {doublings}'\nassert '10' in _out, 'Print the number of doublings.'" }
    ]
  },
  {
    id: "functions", title: "Functions", kanji: "術",
    intro: "A function is a named jutsu: define it once with def, call it as often as you like. Parameters go in, a return value comes out.",
    problems: [
      { id: "fn-1", title: "Greeting jutsu",
        say: "Write a function greet(name) that returns the string 'Welcome to the Leaf, <name>!' — returns it, not prints it.",
        task: "Define `greet(name)` that returns `'Welcome to the Leaf, ' + name + '!'`.",
        starter: "def greet(name):\n    pass\n",
        check: "assert callable(greet), 'Define a function called greet.'\nassert greet('Naruto') == 'Welcome to the Leaf, Naruto!', f'greet(\"Naruto\") returned {greet(\"Naruto\")!r}'" },
      { id: "fn-2", title: "Area of a training ground",
        say: "Functions can take several parameters. Write area(width, height) that returns width times height.",
        task: "Define `area(width, height)` returning their product.",
        starter: "def area(width, height):\n    pass\n",
        check: "assert area(3, 4) == 12 and area(2.5, 2) == 5.0, 'area should multiply width by height.'" },
      { id: "fn-3", title: "Default parameters",
        say: "Parameters can have defaults. Write rank_up(rank, steps=1) that returns the rank `steps` places later in this list.",
        task: "Define `rank_up(rank, steps=1)` using the `RANKS` list; return the rank `steps` positions after `rank`.",
        starter: "RANKS = ['Academy', 'Genin', 'Chunin', 'Jonin', 'Kage']\n\ndef rank_up(rank, steps=1):\n    pass\n",
        check: "assert rank_up('Genin') == 'Chunin', 'rank_up(\"Genin\") should be \"Chunin\" (default one step).'\nassert rank_up('Genin', 2) == 'Jonin', 'rank_up(\"Genin\", 2) should be \"Jonin\".'" }
    ]
  },
  {
    id: "classes", title: "Classes", kanji: "型",
    intro: "A class is a blueprint for objects: data in attributes, behaviour in methods. __init__ runs when you create one; self is the object itself.",
    problems: [
      { id: "cls-1", title: "A Shinobi class",
        say: "Make a class Shinobi with an __init__ that takes name and rank and stores them, plus a method introduce() returning '<name>, <rank> of the Leaf'.",
        task: "Define class `Shinobi` with `name`, `rank` attributes and an `introduce()` method.",
        starter: "class Shinobi:\n    def __init__(self, name, rank):\n        pass\n\n    def introduce(self):\n        pass\n",
        check: "s = Shinobi('Iruka', 'Chunin')\nassert s.name == 'Iruka' and s.rank == 'Chunin', 'Store name and rank on self.'\nassert s.introduce() == 'Iruka, Chunin of the Leaf', f'introduce() returned {s.introduce()!r}'" },
      { id: "cls-2", title: "Methods that change state",
        say: "Objects remember things. Give the Shinobi a missions count starting at 0 and a complete_mission() method that adds one.",
        task: "Add `self.missions = 0` in `__init__` and a `complete_mission()` method that increments it.",
        starter: "class Shinobi:\n    def __init__(self, name):\n        self.name = name\n\n    def complete_mission(self):\n        pass\n",
        check: "s = Shinobi('Lee')\nassert getattr(s, 'missions', None) == 0, 'missions should start at 0.'\ns.complete_mission(); s.complete_mission()\nassert s.missions == 2, 'complete_mission() should add one each call.'" }
    ]
  },
  {
    id: "inheritance", title: "Inheritance", kanji: "継",
    intro: "A subclass inherits everything from its parent and can add or override. super() reaches the parent's version.",
    problems: [
      { id: "inh-1", title: "Jonin is a Shinobi",
        say: "Here's a Shinobi class. Make a Jonin subclass whose rank is always 'Jonin' — call the parent's __init__ with super().",
        task: "Define `class Jonin(Shinobi)` whose `__init__(self, name)` calls `super().__init__(name, 'Jonin')`.",
        starter: "class Shinobi:\n    def __init__(self, name, rank):\n        self.name = name\n        self.rank = rank\n\n    def introduce(self):\n        return f'{self.name}, {self.rank}'\n\n# your subclass here\n",
        check: "k = Jonin('Kakashi')\nassert isinstance(k, Shinobi), 'Jonin should inherit from Shinobi.'\nassert k.rank == 'Jonin' and k.name == 'Kakashi', 'Pass the name through and set rank to Jonin.'\nassert k.introduce() == 'Kakashi, Jonin'" },
      { id: "inh-2", title: "Override a method",
        say: "Subclasses can override. Make a Hokage subclass of Shinobi whose introduce() returns 'Lord <name>, Hokage'.",
        task: "Define `class Hokage(Shinobi)` that overrides `introduce()`.",
        starter: "class Shinobi:\n    def __init__(self, name):\n        self.name = name\n\n    def introduce(self):\n        return self.name\n\n# your subclass here\n",
        check: "h = Hokage('Tsunade')\nassert isinstance(h, Shinobi), 'Hokage should inherit from Shinobi.'\nassert h.introduce() == 'Lord Tsunade, Hokage', f'introduce() returned {h.introduce()!r}'" }
    ]
  },
  {
    id: "imports", title: "Imports & Libraries", kanji: "巻",
    intro: "Python ships with a library of scrolls. import brings one in; from ... import takes just what you need.",
    problems: [
      { id: "imp-1", title: "Square root",
        say: "The math module has sqrt. Import it and print the square root of 144.",
        task: "Import `math` and print `math.sqrt(144)`.",
        starter: "",
        check: "assert 'import' in _src and 'math' in _src, 'Import the math module.'\nassert '12' in _out, 'Print math.sqrt(144), which is 12.0'" },
      { id: "imp-2", title: "Pick one from random",
        say: "Use from random import choice to pick a name from the list, and print it. Any name is fine — I just need to see the import.",
        task: "`from random import choice`, then print `choice(names)`.",
        starter: "names = ['Naruto', 'Sasuke', 'Sakura']\n",
        check: "assert 'from random import' in _src, 'Use the from ... import form.'\nassert _out.strip() in names, 'Print one of the names chosen with choice().'" },
      { id: "imp-3", title: "Counting with collections",
        say: "collections.Counter counts things for you. Count the letters in the word and print how many times 'a' appears.",
        task: "Use `Counter` from `collections` to count letters in `word`, then print the count for `'a'`.",
        starter: "word = 'kagebunshin'\n",
        check: "assert 'Counter' in _src, 'Use collections.Counter.'\nassert _out.strip().endswith('1'), \"'a' appears once in kagebunshin.\"" }
    ]
  },
  {
    id: "copies", title: "Copies & References", kanji: "影",
    intro: "Assigning a list to a new name doesn't copy it — both names point at the same list, like a shadow clone sharing one body. Use list(x) or x.copy() for a real copy. Numbers and strings can't be changed in place, so they behave like copies.",
    problems: [
      { id: "ref-1", title: "Shadow clone",
        say: "Watch this. clone = original makes a second name, not a second list. Append to clone and print original. Then explain nothing — just observe the output.",
        task: "Append `'Sasuke'` to `clone`, then print `original`.",
        starter: "original = ['Naruto']\nclone = original\n",
        check: "assert original == ['Naruto', 'Sasuke'], 'Append Sasuke to clone — original changes too, because they are the same list.'\nassert \"['Naruto', 'Sasuke']\" in _out" },
      { id: "ref-2", title: "A real copy",
        say: "Now make a true copy with list() or .copy(), append to the copy, and print the original. It should be untouched.",
        task: "Make `copy` a real copy of `original`, append `'Sasuke'` to `copy`, then print `original`.",
        starter: "original = ['Naruto']\n",
        check: "assert 'copy' in dir() and copy == ['Naruto', 'Sasuke'], 'copy should contain Naruto and Sasuke.'\nassert original == ['Naruto'], 'original must stay unchanged — use list(original) or original.copy().'\nassert \"['Naruto']\" in _out" },
      { id: "ref-3", title: "Functions and lists",
        say: "A function that gets a list can change the caller's list. Write add_member(team, name) that appends, and watch squad change.",
        task: "Define `add_member(team, name)` that appends `name` to `team`. Call it with `squad` and `'Sai'`, then print `squad`.",
        starter: "squad = ['Naruto', 'Sakura']\n\ndef add_member(team, name):\n    pass\n",
        check: "assert squad == ['Naruto', 'Sakura', 'Sai'], 'squad should gain Sai through the function.'\nassert \"['Naruto', 'Sakura', 'Sai']\" in _out, 'Print squad after calling add_member.'" }
    ]
  }
];
