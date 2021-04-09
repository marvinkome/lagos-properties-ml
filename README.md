# Lagos properties project

### Rent prediction

This is a project I used to perform data analysis on properties listed in nigerian property center for houses in Lagos. The purpose of this project is to learn more about data science, data analysis and machine learning.

Using selenium, I fetched data from nigerianpropertycenter.com for houses in Yaba, Surulere, Gbadaga and Maryland. Then using features such as

- Number of rooms
- City (Yaba, Surulere, Gbagada or Maryland)
- Serviced apartment
- Funished apartment
- Number of bathrooms
- Number of toilets
- Month added to site

I was able to build a model that predicts the rent of a house.
The predictions on average were off by 26% (when using keras and tensorflow) and 25.5% (when using random forest)

To improve this model I can add more features like

- Upstairs or Downstairs
- Using the images to get more features about the standard of the house

### Area prediction

Using selenium, I fetched data from nigerianpropertycenter.com for houses in Yaba, Surulere, Gbadaga and Maryland. Then using features such as

- Number of rooms
- City (Yaba, Surulere, Gbagada or Maryland)
- Serviced apartment
- Funished apartment
- Number of bathrooms
- Number of toilets
- Month added to site

I was able to build a model that predicts the area a house is located.

**Accuracy** (mean absolute error): 0.47
