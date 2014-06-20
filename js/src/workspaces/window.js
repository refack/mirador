(function($) {

  $.Window = function(options) {

    jQuery.extend(true, this, {
      element:           null,
      appendTo:          null,
      manifest:          null,
      currentImg:        null,
      defaultState:      'ThumbnailsView',
      uiState:           {'ThumbnailsView': false, 'ImageView': false, 'ScrollView': false, 'BookView': false},
      uiViews:           {'ThumbnailsView': null, 'ImageView': null, 'ScrollView': null, 'BookView': null},
      uiOverlaysAvailable: {
        'ThumbnailsView': {
            'overlay' : {'MetadataView' : false}, 
            'sidePanel' : {'' : false},//'TableOfContentsView',
             'bottomPanel' : {'' : false}
        },
        'ImageView': {
            'overlay' : {'MetadataView' : false}, 
            'sidePanel' : {'' : false},//'TableOfContentsView', 
            'bottomPanel' : {'ThumbnailsView' : true}
        },
        'ScrollView': {
            'overlay' : {'MetadataView' : false}, 
            'sidePanel' : {'' : false},//'TableOfContentsView',
            'bottomPanel' : {'' : false}
        },
        'BookView': {
            'overlay' : {'MetadataView' : false},
            'sidePanel' : {'' : false},//'TableOfContentsView', 
            'bottomPanel' : {'ThumbnailsView' : true}
        }
      },
      sidePanel: null,
      bottomPanel: null,
      overlay: null

    }, $.DEFAULT_SETTINGS, options);

    this.init();

  };

  $.Window.prototype = {
    init: function () {
      this.updateState(this.defaultState);

      this.element = jQuery(this.template()).appendTo(this.appendTo);

      this.bindEvents();
    },

    bindEvents: function() {
      var _this = this;

      jQuery.subscribe('manifestToWindow', function(_, manifest, uiState) {
        if (uiState) {
          _this.updateState(uiState);
        } else {             
          _this.updateState(_this.defaultState);
        }
        jQuery.each(_this.uiState, function(key, value){ 
          if (value && _this.manifest != manifest) {
            
            //reset the window div and update manifest
            _this.clearWindow();
            _this.manifest = manifest;
            
            //add manifest title and nav bar and bind nav bar events
            _this.element.prepend(_this.manifestInfoTemplate({title: manifest.label}));
            _this.element.find('.mirador-icon-thumbnails-view').on('click', function() {
              _this.toggleThumbnails();
            });
            
            //clear any existing objects
            _this.clearViews();
            _this.clearPanelsAndOverlay();
            
            //attach any panels or overlays for view
            jQuery.each(_this.uiOverlaysAvailable[key], function(type, viewOptions) {
                jQuery.each(viewOptions, function(view, displayed) {
                    if (view !== '') {
                        _this[type] = new $[view]({manifest: manifest, appendTo: _this.element.find('.'+type), parent: _this, panel: true});
                        if (displayed) {
                            _this.togglePanels(type, displayed);
                        }
                    }
                });
            });
            //attach view
            _this.uiViews[key] = new $[key]( {manifest: manifest, appendTo: _this.element.find('.view-container'), parent: _this} );
            _this.toggleUI(key);
            //toggle display of panels
          }
        });
      });

      jQuery.subscribe('toggleImageView', function(_, imageID) {
        _this.toggleImageView(imageID);	
      });

    },

    updateState: function(state) {
      var _this = this;
      jQuery.each(this.uiState, function(key, value) {
        if (key === state) {
          _this.uiState[key] = true;
        } else {
          _this.uiState[key] = false;
        }
      });
    },

    clearViews: function() {
      var _this = this;
      jQuery.each(_this.uiViews, function(key, value) {
        _this.uiViews[key] = null;
      });
    },
    
    clearWindow: function() {
       this.element.remove();
       this.element = jQuery(this.template()).appendTo(this.appendTo);
    },
    
    clearPanelsAndOverlay: function() {
       this.sidePanel = null;
       this.bottomPanel = null;
       this.overlay = null;
    },
    
    //only panels and overlay available to this view, make rest hidden while on this view
    updatePanelsAndOverlay: function() {

    },

    get: function(prop, parent) {
      if (parent) {
        return this[parent][prop];
      }
      return this[prop];
    },

    set: function(prop, value, options) {
      if (options) {
        this[options.parent][prop] = value;
      } else {
        this[prop] = value;
      }
    },
    
    togglePanels: function(type, state) {
        this[type].toggle(state);
    },

    // One UI must always be on      
    toggleUI: function(state) {
      var _this = this;

      jQuery.each(this.uiState, function(key, value) {
        if (key != state && _this.get(key, 'uiState') === true) {
          _this.set(key, false, {parent: 'uiState'});
          if (_this.uiViews[key]) {
            _this.uiViews[key].toggle(false);
          }
        }
      });
      this.set(state, true, {parent: 'uiState'});
      this.uiViews[state].toggle(true);
      this.updatePanelsAndOverlay();
    },

    toggleThumbnails: function() {
      if (this.uiViews.ThumbnailsView === null) {
        this.uiViews.ThumbnailsView = new $.ThumbnailsView( {manifest: this.manifest, appendTo: this.element.find('.view-container'), parent: this} );
      }
      this.toggleUI('ThumbnailsView');
    },

    toggleImageView: function(imageID) {
      if (this.uiViews.ImageView === null) {
        this.uiViews.ImageView = new $.ImageView( {manifest: this.manifest, appendTo: this.element.find('.view-container'), parent: this, imageID: imageID} );
      } else {
        var view = this.uiViews.ImageView;
        view.updateImage(imageID);
      }
      this.toggleUI('ImageView');
    },
    
    toggleBookView: function(imageID) {
    },
    
    toggleScrollView: function(imageID) {
    },

    //template should be based on workspace type
    template: Handlebars.compile([
                                 '<div class="window">',
                                   '<div class="content-container">',
                                     '<div class="sidePanel"></div>',
                                     '<div class="view-container">',
                                       '<div class="overlay"></div>',
                                       '<div class="bottomPanel"></div>',
                                     '</div>',
                                   '</div>',
                                 '</div>'
    ].join('')),

    manifestInfoTemplate: Handlebars.compile([
                                             '<div class="manifest-info">',
                                             '<div class="window-manifest-navigation">',
                                             '<a href="javascript:;" class="mirador-btn mirador-icon-thumbnails-view"></a>',
                                             '</div>',
                                             '<h3 class="window-manifest-title">{{title}}</h3>',
                                             '</div>'
    ].join(''))
  };

}(Mirador));

