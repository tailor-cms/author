import _ from 'lodash';

// prettier-ignore
export const moduleListTemplate = _.template(
`<% _.forEach(entries, function(it, index) { %>import pkg<%- index %> from '<%- it %>';<%}); %>
// prettier-ignore
export const elements = [
  <% entries.forEach(function(it, index) { %>pkg<%- index %>,
  <%});%>
`);
