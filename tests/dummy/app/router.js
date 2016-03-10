import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('virtual');
  this.route('images');
  this.route('scroll-position');
});

export default Router;
