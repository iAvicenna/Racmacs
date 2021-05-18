
// Main function to load new map data
Racmacs.Viewer.prototype.load = function(
    mapData,
    options = {},
    plotdata
    ){

    if(options.maintain_viewpoint){ 
        var selected_points = this.getSelectedPointIndices(); 
        var selected_projection = this.data.projection();
    }

    // Clear previous plots
    this.contentLoaded = false;
    this.data.clear();
    this.scene.empty();
    this.clearDiagnostics();
    this.clearBrowsers();
    this.clearAntigensAndSera();
    this.controlpanel.disableProjectionTabs();

    // Set viewer controls
    if(options["viewer.controls"] !== "hidden") this.controlpanel.show();
    if(options["viewer.controls"] === "optimizations") this.controlpanel.tabset.showTab("projections");

    // Plot new map data
    if(mapData === null) {

        this.setTitle("Racmacs viewer");
        this.viewport.showPlaceholder();
        this.controlpanel.disableContentLoadedTabs();

    } else {

        // Set map data and options
        this.mapPlotdata = plotdata;

        // Enable control panel options
        this.controlpanel.enableContentLoadedTabs();

        // Set the map data
        this.data.load(mapData);

        // Set projection controls
        if(this.data.numProjections() > 0) {
            this.controlpanel.enableProjectionTabs();
            this.viewport.hidePlaceholder();
            this.animated = true;
        } else {
            this.controlpanel.disableProjectionTabs();
            this.viewport.showPlaceholder();
            this.animated = false;
        }

        // Update viewer title
        this.setTitle(this.data.tableName());

        // Generate the antigen and sera objects
        this.addAntigensAndSera();

        // Set dims from map data
        if(!options.maintain_viewpoint){
            this.setDims();
        }

        // Load the hi table
        this.hideTable();

        // Set the grid
        if(options["grid.display"] !== "rotate"){
            this.setGrid(options);
        }

        // Add points to the plot
        if(this.data.numProjections() > 0) {
            this.addAgSrPoints();
        }

        // Update the stress
        this.updateStress();

        // Update antigen and sera browsers
        this.browsers.antigens.populate();
        this.browsers.sera.populate();

        // Update filters
        this.filter.update();

        // Update list of projections
        this.projectionList.populate();

        // Reset the camera transformation
        if(!options.maintain_viewpoint){
            this.resetTransformation();
        }

        // Switch to the right projection
        if(mapData && this.data.numProjections() > 0){
            this.switchToProjection(this.data.projection());
        }

        // Populate the plot with any plotting data
        if(plotdata && plotdata.length){
            this.scene.populatePlot({
                plot: plotdata
            });
        }

        // Add any boostrap info
        var bootstrap = this.data.bootstrap();
        if(bootstrap !== undefined){
            this.showBootstrapPoints(bootstrap);
        }

        // Render the plot
        if(this.data.numProjections() > 0) {
            this.render();
        }

        // Fire any resize event listeners (necessary for setting pixel ratio)
        this.viewport.onwindowresize();

        // Set camera zoom
        if(this.data.numProjections() > 0 && !options.maintain_viewpoint) {
        
            var zoom = this.data.getViewerSetting("zoom");
            if(zoom === null){
                
                var xlim = this.data.xlim();
                var ylim = this.data.ylim();
                var zlim = this.data.zlim();

                var scale = this.scene.getWorldScale();
                xlim = [xlim[0]*scale[0], xlim[1]*scale[0]];
                ylim = [ylim[0]*scale[1], ylim[1]*scale[1]];
                zlim = [zlim[0]*scale[1], zlim[1]*scale[1]];

                this.camera.zoomToLims({
                    x : xlim,
                    y : ylim,
                    z : zlim
                });
                this.camera.setDefaultZoom();

            } else {

                this.camera.setZoom(zoom);
                this.camera.setDefaultZoom();

            }

        }

        // Allow for any sequence data
        var ag_sequences = this.data.agSequences(0);
        if(ag_sequences !== null){
            this.colorpanel.showColorBySequence();
            this.btns["viewSequences"].style.display = "";
        } else {
            this.colorpanel.hideColorBySequence();
            this.btns["viewSequences"].style.display = "none";
        }

        // Deal with viewer options
        if(options["point.opacity"] !== undefined && options["point.opacity"] !== null)  this.styleset.noselections.unhovered.unselected.opacity = options["point.opacity"];
        this.updatePointStyles();

        // Reselect any points
        if(options.maintain_viewpoint){ 
            this.selectByPointIndices(selected_points); 
            this.switchToProjection(selected_projection);
        }

        // Run the function to toggle plot content that is shown dynamically based on scene rotation
        if(this.scene.dynamic) this.scene.showhideDynamics(this.camera.camera);

        // Note that content is now loaded
        this.contentLoaded = true;

    }

    // Dispatch the map loaded event
    window.dispatchEvent(
        new CustomEvent('racViewerMapLoaded', { detail : this })
    );


}



Racmacs.LoadPanel = class LoadPanel {

    constructor(viewer){

        // Link to viewer
        this.viewer = viewer;
        viewer.loadpanel = this;

        // Add div
        this.div = document.createElement("div");
        this.div.classList.add("load-tab");
        this.div.classList.add("shiny-element");

        // Add load map button
        var loadmap = new Racmacs.utils.Button({
            label: "Load map",
            fn: function(){ viewer.onLoadMap() }
        });
        this.div.appendChild(loadmap.div);

        // Add load table button
        var loadtable = new Racmacs.utils.Button({
            label: "Load table",
            fn: function(){ viewer.onLoadTable() }
        });
        this.div.appendChild(loadtable.div);

    }

}







