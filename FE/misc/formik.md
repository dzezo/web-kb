## Formik

You need to provide name for input in order for handleChange to work

```jsx
import { useFormik } from "formik";
import * as Yup from "yup"; // validation lib (inspired by JOI)

const FormComponent = () => {
  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
    validationSchema: Yup.object({
      firstName: Yup.string().max(15, "Must be 15 characters or less").required(),
    }),
    onSubmit: (values) => {
      // prevents default automatically
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <input
        id="firstName"
        name="firstName"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.firstName}
      />
      {formik.touched.firstName && formik.errors.firstName && <p>{formik.errors.firstName}</p>}
      <button type="submit">Submit</button>
    </form>
  );
};
```
