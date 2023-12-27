# CSS Grid

Declares that we are going to use grid display system.

```css
display: grid;
```

Gap between children (it does not create margin space outside of parent).
It goes well with grid system, instead of standard margins.

```css
gap: 1.5rem;
```

#### grid-template-columns

Defines how many columns our grid is going to have. Down below are some examples.

```css
/* One column that has width of 100px */
grid-template-columns: 100px;

/* Three columns that have width of 25% */
grid-template-colums: 25% 25% 25%;
```

There are special units in grid system called fractions (fr), and we can tell our grid system to divide our columns equaly

```css
/* Three columns, examples below accomplish same thing */
grid-template-colums: 1fr 1fr 1fr;
grid-template-colums: repeat(3, 1fr);
```

The `1fr` unit in CSS Grid indeed represents a fraction of the available space in the grid container. However, by default, grid items can stretch to accommodate their content, which can lead to unequal column widths if the content varies significantly in size. The `minmax(0, 1fr)` function is a way to overcome this.

If you don't declare grid rows your are creating implicit grid, meaning grid system will add rows when it reaches it's three columns

You can attach this css propery to some **grid item** and it will make it span 2 grid columns, you can think of it as **table colspan**

```css
grid-column: span 2;
```

Now one thing to note from previous example is that span keyword if you omit that keyword, and say something like

```css
grid-column: 2;
```

That would be the same as saying:

```css
grid-column-start: 2;
```

Which will place grid item into specific column. You can use the same thing for rows

```css
grid-row-start: 1;
```

Next two lines do exact same thing:

```css
grid-row-end: span 2
grid-row-end 3

/* Or you can use shorthand for all of the above by saying */

grid-row: 1 / 3;
grid-row: 1 / span 2;
```

If you are ever in need of selecting a specific child you can use this:

```css
/* This will select 3rd grid item */
.grid-item: nth-child(3);
```

### Grid Template Areas

Every set of qoutation mark (it can also be double "") is one row. So in example below we named each grid area and set grid system to have only one area at each row

```css
grid-template-areas:
  "one"
  "two"
  "three"
  "four"
  "five";
```

To connect grid child to specific grid area you use:

```css
/* DON'T USE QUOTATION MARKS */
.grid:nth-child(1) {
  grid-area: one;
}
```

This is super usefull especialy if you work with media queires like this:

```css
@media (min-width: 50em) {
  /* Now on smaller screens we have 2 rows instead, this repeating names indicate different colspans */
  .grid {
    grid-template-areas:
      "one one two five"
      "three four four five";
  }
}
```

### Grid Auto Columns

This property tells grid system whenever it generates auto column it needs to conform to specific size example:

```css
/* Any newly generated column will be exactly 1fr */
grid-auto-columns: 1fr;
```
