## Styled Components

Styled Components are used to create Components that exist only to give certain look that we are going after. You can think of them as component that allow you to keep your code free from things like _className="some-class-name"_. With styled components your code will look something like this:

```tsx
<StyledHeader>
  <Container>
    <Nav>
      <Logo src="./images/logo.svg" alt="" />
      <Button>Try It Free</Button>
    </Nav>
    <Flex>
      <div>
        <h1>Build the Community Your Fans Will Love</h1>
        <p>Lorem ipsum sit dolor amet.</p>
        <Button bg="#ff0099" color="#fff">
          Get Started For Free
        </Button>
      </div>
      <Image src="./images/illustration-mockups.svg" />
    </Flex>
  </Container>
</StyledHeader>
```

Every component that wraps around some content here is a styled component, you can notice how there are no class names written here. Now let's look at StyledHeader component for example, this is imported from Header.styled.js file and that files looks something like this:

```ts
export const StyledHeader = styled.header`
  background-color: ${({ theme }) => theme.colors.header};
  padding: 40px 0;
`;

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;

  @media (max-width: ${({ theme }) => theme.mobile}) {
    flex-direction: column;
  }
`;

export const Logo = styled.img`
  @media (max-width: ${({ theme }) => theme.mobile}) {
    margin-bottom: 40px;
  }
`;

export const Image = styled.img`
  width: 375px;
  margin-left: 40px;

  @media (max-width: ${({ theme }) => theme.mobile}) {
    margin: 40px 0 30px;
  }
`;
```

Syntax goes like this, first we declare type of HTML element that we are using by saying styled.nav or styled.img etc... One thing to note here lets take for example Logo as a styled component. We defined it as an img and by doing so we can use HTML img properties on that component like this:

```tsx
<Logo src="./images/logo.svg" alt="" />
```

You can see from the code above we never defined this prop within Logo const and yet we can use it, that's because this styled component is an img tag in DOM.

After we declare type of our HTML element we open interpolation template with this `` and we can write pure scss in.
You can do everything within that template, you can nest things, declare media queries and you can use your props or you can use Global props:

#### Example for nesting things:

```ts
export const StyledSocialIcons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  li {
    list-style: none;
  }

  a {
    border: 1px solid #fff;
    border-radius: 50%;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    height: 40px;
    width: 40px;
    text-decoration: none;
  }
`;
```

#### Example that uses local props:

```ts
export const Button = styled.button`
  border-radius: 50px;
  border: none;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  padding: 15px 60px;
  background-color: ${({ bg }) => bg || "#fff"};
  color: ${({ color }) => color || "#333"};

  &:hover {
    opacity: 0.9;
    transform: scale(0.98);
  }
`;
```

You can see that we can define :hover, :focus, :active by using scss parent selector (&) and alse take a look at Button background-color and color css property

```ts
${({ bg }) => bg || "#fff"};

// this can also be written as
${(props) => props.bg || "#fff"};
```

we are only destructuring what we need from props and **this is the usage with local props** that are coloring our button when needed

```tsx
<Button bg="#ff0099" color="#fff">
  Get Started For Free
</Button>
```

#### Example that uses global props

We can use special component that styled-component lib offers called **ThemeProvider** that allows us to define and switch themes seamlessly. We can define our theme in App.js for example like this

```ts
const theme = {
  colors: {
    header: "#ebfbff",
    body: "#fff",
    footer: "#003333",
  },
  mobile: "768px",
};
```

in this object we have colors and also responsive breaking points and then we can use ThemeProvider object to wrap our content.

```tsx
<ThemeProvider theme={theme}>
  <GlobalStyles />
  <Header />
  <Container>
    {content.map((item, index) => (
      <Card key={index} item={item} />
    ))}
  </Container>
  <Footer />
</ThemeProvider>
```

As you can see we are providing theme prop value to ThemeProvider component, and when we do so we can then access those values in our local components like this:

```ts
@media (max-width: ${({ theme }) => theme.mobile}) {
  flex-direction: column;
}
```

this is equal to (max-width: 768px), similarly we can use other values as well. In this example we destructured our props object to expose our theme object that was passed as a value to ThemeProvider.

If you take a look at code above you can notice component called GlobalStyles, that is ordinary styled component that can be made to replace our **app.css** and **index.css** files and it functions like those things. It is used to provide general styles to nested components. This is code that allows us to create global styles.

```ts
import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
  * {
    box-sizing: border-box;
  }
  body {
    background: ${({ theme }) => theme.colors.body};
    color: hsl(192, 100%, 9%);
    font-family: 'Poppins', sans-serif;
    font-size: 1.15em;
    margin: 0;
  }
  p {
    opacity: 0.6;
    line-height: 1.5;
  }
  img {
    max-width: 100%;
  }
`;

export default GlobalStyles;
```

we import createGlobalStyles from styled-component and we write template for it that will be applied to all nested components. As you can see from this example we can even use @import to import custom font to our styling.

#### Advanced usage

```tsx
<CardTitle2 $edited={true}>
    <H3>123</H3>
</CardTitle2>

<Container.Main>
    <Container.Main2>abc</Container.Main2>
</Container.Main>

<NarrowBox />

<Card>
    <Card.Header></Card.Header>
    <Card.Footer></Card.Footer>
</Card>

/** Styled components
***************************************************/

interface CardTitle2Props {
  $edited: boolean;
}

// in order to use css keyword you need to import it
// import { css } from "styled-components";
const mixin = css`
  font-size: 32px;
  font-weight: bold;
`;

const H3 = styled.h3`
  padding-top: 20px;
`;

// in this example we are embedding css
// reacting to $edited prop
// and expanding H3 styles to encompass text-align property
const CardTitle2 = styled.div<CardTitle2Props>`
  ${mixin}
  background-color: ${(p) => p.$edited && "#000"};

  ${(p) =>
    p.$edited &&
    css`
      color: orange;
    `}

  ${H3} {
    text-align: center;
  }
`;

// You can organize your styled components like this
// Use Container.Main for access
const Container: = {
  Main: styled.div`
    background-color: blue;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
  `,

  Main2: styled.div`
    padding: 10px;
  `,
};

// If you want to expand styling of some component you can do it like this
const Box = styled.div`
  background-color: yellow;
  height: 50px;
  width: 50px;
`;
const NarrowBox = styled(Box)`
  max-width: 10px;
`;

// You can even set up functional component in a separate file
// See example of usage above
const CardWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  height: 20px;
  background-color: red;
`;

const Footer = styled.footer`
  height: 30px;
  background-color: green;
`;

const Card = ({ children, ...props }: any) => (
    <CardWrapper {...props}>{children}</CardWrapper>;
)
Card.Header = Header;
Card.Footer = Footer;

// and then you can say
// export default Card
```
