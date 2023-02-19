## ROUTING

- The only reserved folder name is pages, other folders you can name however you like.

- When we create index.js in pages folder that means that index.js will be our root page (page that gets visited when you do 'our-domain.com/').

- Next to index.js file we can create news.js file and that would mean that we created another page that is going to get visited when we do 'our-domain.com/news' (index is a special name that stands for root or "slash-nothing")

- So takeaway here is that our filename is going to be used as pathname

- In NextJs we dont need to do import 'React' from react since it's done behind the scene.

- Let's say that you have structure like this

- pages
-- index.js
-- news.js

This is what we have done already, you can do this diffrently be making news folder within pages folder

- pages
-- index.js
-- news
---- index.js

This is equivalent of what we have done above, but this type of structure offers a posibility of creating nested routes.

- pages
-- index.js
-- news
---- index.js                   // our-domain.com/news
---- something-important.js     // our-domain.com/news/something-important

There is really no limit to how deep you can nest so the following is also equal

- pages
-- index.js
-- news
---- index.js                   // our-domain.com/news
---- something-important
------ index.js                 // our-domain.com/news/something-important 

## DYNAMIC ROUTES

You need to use special syntax to tell nextJS what is your dynamic route and you do that by using square brackets with identifier, name of identifier is up to you eg. [newsId].js

There are two approaches that accomplish the same thing

- [newsId].js
- [newsId]                      // folder variant, this will allow for dynamic nested pages
-- index.js

Extracting identifier:

- To extract value, nextJS gives us a hook (it also has alternative for class based components).

import { useRouter } from 'next/router';

function NewsPage() {
  const router = useRouter();

  return <h1>{router.query.newsId}</h1>;
}

## Linking between page

-We can use <a> tags with href and it would work, but at a cost. It will request new HTML Page from our backend everytime user navigates around.

<a href="/news/nextjs">NextJS Is A Great FrameWork</a>

-As with react-router-dom, we can use Link component which is this time imported as default from import Link from 'next/link';

import Link from 'next/link'

<Link href="/news/nextjs">NextJS Is A Great FrameWork</Link>

- as you can see usage is simple just replace a tag with Link and you are good to go. This will work for Search Engines.
- for site internal links you want to use Link component.

## Wrapper Components (Like General Layout)

function Layout(props) {
  return (
    <div>
      <MainNavigation />
      <main className={classes.main}>{props.children}</main>
    </div>
  );
}

- In pages folder there is a special file _app.js that is root of your application

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

- It has two props, first is Component that is going to be rendered on page change, and second is pageProps our page might be getting. Because Component is going to be what we see on each page change we can take advantage of this and wrap it with our Layout component. With this we are going to see our general layout on each page.

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

## Programatic navigation

import { useRouter } from 'next/router';

const router = useRouter();

function showDetailsHandler() {
    router.push('/');           
}

- This will push root page to history stack and is equivalent of using Link component to get there.

## Page Pre-Rendering

const HomePage = () => {
    const [data, setData] = useState([]);

    useEffect(() => setData['abc'], []);

    return (
        <>
            <ul>
                {data.map((e, i) => (
                    <li key={i}>{e}</li>
                )}
            </ul>
         </>
    )
}

- In this situation when you click to view source of this page you are going to get ul element with no li. This is because render is going to execute first before useEffect, you are going to see li elements only on second render, and user is not going to notice any difference, but search engines will, because next is going to return the result of the very first render that does not contain any li elements, which means that nextJS by default is not going to wait for your data to be done fetching.

- When you make a request for a specific route you are going to get some pre-rendered content which is good for SEO but it might not be if that page is later hydrated with React, meaning crucial content is loaded which makes application interactive.

- NextJS offer two types of pre-rendering: static generation and ssr

- When using static generation, your pages are pre-rendered when you build your nextJS application, much like react-snap library does.

- if you need to add data fetching to your PAGE component you can do so by exporting special function inside your PAGE component. It is important to stress that this works only in your page component files, and not in other react component files.

- This function needs to be called getStaticProps and it is sort of a reserved name, nextJS will look for this function and it will execute this function during pre-rendering process. It will first call getStaticProps before it calls component function. This function can be async and the KEY thing is that nextJS will wait for this promise to resolve. You can run any backend code here, like securly connection to DB etc. Because this bit of code will never end up on client side. Simply because this code is executed during the build process.

- You can do many things in this function, but you always have to return an object. In this object you can configure various thing, but most importantly you typically set props property, and that property hold another object which will be props object that you recieve in your PAGE COMPONENT.

- So the proper way of implementing our example above is

const HomePage = (props) => {
    return (
        <>
            <ul>
                {props.map((e, i) => (
                    <li key={i}>{e}</li>
                )}
            </ul>
         </>
    )
}

export function getStaticProps() {
    return {
        props: ['abc']
    }
}

- SSR - uses getInitialProps, getServerSideProps
- Static - no initial props
- SSG - uses getStaticProps
- ISG - uses getStaticProps + revalidate

- Now what happens if your landing page gets updated, you are still going to display stale data. There is an extra property which we can add to getStaticProps called revalidate. Revalidate takes number of seconds nextJS will wait until it regenerates this page for incoming request. This means that this page will not only by generated during build time but every 10 sec. on the server as well.

export function getStaticProps() {
    return {
        props: ['abc'],
        revalidate: 10
    }
}

- If you need to regnerate page on every request then there is an alternative to getStaticProps and that is getServerSideProps. This function is not going to run during build process but only on the server after deployment. It still return the same object with props property. This function also come with context prop which gives you access to req and res, this way you get access to request header and body which can give you extra information.

## Dynamic Path Params (getStaticProps)

- What if we want to fetch data for something specific, for example [newsId]. we can't use useRouter hook inside getStaticProps or getServerSideProps because those are not funcitonal components. For this case there is a context parameter it exists on both getStaticProps and getServerSideProps. On getStaticProps it has params property that will hold value encoded into url.

export async function getStaticProps(context) {
    const newsId = context.params.newsId;
}

- This will not work because you need to export function called getStaticPath if you are using getStaticProps on a dynamic page. This is not needed if you are using getServerSideProps. Reason why this is important for getStaticProps is that SSG works by pre-rendering all the pages in build time, and the question that comes from that is how is next going to now for which id's to pre-render a page since it is dynamic. So in conclussion getStaticPaths has a job to define all values our dynamic path can take so that it all gets rendered during build time, and if user visits some id that was not included he is going to see 404 page.


export async function getStaticPaths() {
    return {
        fallback: false, // this property key tells nextJS whether your paths key contains all possible ids (false means yes)
        paths: [
            { params: { // params property is required
                newsId: 'n1', // should have concrete value defined
                // other dynamic segments if there are any.
              } 
            },
            { params: {
                newsId: 'n2',
              } 
            },
            // for every dynamic route we are going to have another object that has params property
        ]
    }
}

- fallback: false - if user enters id that is not contained withing paths key he will be presented with 404 page
- fallback: true - if user enters id that is not contained nextJS will attempt to generate page on the server

- In real situation developer is not going to hard code this paths are but generate it instead. This is done so by making request to backend and getting the list of all valid ids. NextJS includes fetch feature in its server side part, so that you can get data from the server.

export async function getStaticPaths() {
    const client = await MongoClient.connect('mongodb+srv://');
    const db = client.db();

    const meetupsCollection = db.collection('meetups');
    
    const meetups = await meetupsCollection.find({}, {_id: 1}).toArray();

    return {
        fallback: false, // this property key tells nextJS whether your paths key contains all possible ids (false means yes)
        paths: meetups.map(meetup => ({ 
            params: { 
                meetupId: meetup._id.toString()
            } 
        });
    }
}

## API Routes

- NextJS allows you to build your backend API along side your frontend project, and it comes together with nextJS out of the box. API Routes/Pages are special pages that don't return HTML code but are dealing with HTTP Requests.

- pages
-- api
---- new-meetup.js
-- index.js

- api folder is contained withing pages folder and the name is reserved, name of every .js file within api folder will be used as endpoint identifier. Code withing these files will never run on the client and also is not going to be exposed to the client side so in turn we can even use credentials here. These function will be triggered whenever a request is sent for example /api/new-meetup (see example above). Name of the function is not important, important thing is that we have default export.

// /api/new-meetup
// POST /api/new-meetup

import { MongoClient } from 'mongodb'

async function handler(req, res) {
    if (req.method === 'POST') {
        const data = req.body;

        const client = await MongoClient.connect('mongodb+srv://');
        const db = client.db();

        const meetupsCollection = db.collection('meetups');
        
        const result = await meetupsCollection.insertOne(data);

        client.close();

        res.status(201).json(result);
    }
}

export default handler;

- Triggering this handler is done like you would usually do this things in react with fetch or with 3rd party libs like axios.

const response = await fetch('/api/new-meetup', { 
    method: "POST", 
    body: JSON.stringify(data), 
    headers: { 'Content-Type': 'application/json' } 
});

const data = await response.json();

## NextJS Head

- To add elements to head part of your HTML document you can use Head component provided from nextJS.

import Head from 'next/head';

function HomePage(props) {
    return (
        <Fragment>
            <Head>
                <title>Home Page</title>
                <meta name='description' content='Some description' />
            </Head>
            <MeetupList />
        </Fragment>
    )
}








 













