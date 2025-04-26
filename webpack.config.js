var webpack = require('webpack');

module.exports = {
    //performance: {
    //    hints: false,
    //    maxEntrypointSize: 512000,
    //    maxAssetSize: 512000
    //},
    entry: ['./wwwroot/js/minescape/data.js', './wwwroot/js/minescape/tabs.js', './wwwroot/js/minescape/puzzle.js', './wwwroot/js/minescape/light.js', './wwwroot/js/minescape/cypher.js', './wwwroot/js/minescape/anagram.js', './wwwroot/js/minescape/chest.js', './wwwroot/js/minescape/beacon.js', './wwwroot/js/minescape/hotcold.js', './wwwroot/js/minescape/map.js', './wwwroot/js/minescape/ge.js'],
    output: {
        path: __dirname + '/wwwroot/dist',
        filename: 'minescape-solvers.js',
    },
    module: {
        rules: [
            {
                test: /\.worker\.js$/,
                include: [
                    __dirname + "/wwwroot/dist",
                ],
                loader: 'worker-loader',
                options: { name: '[name].js' }
            },
        ]
    },
    plugins: [
        new webpack.SourceMapDevToolPlugin({
            filename: "[file].map"
        })
    ],
    stats: {
        colors: true
    },
    devtool: 'eval-source-map',
    mode: 'production',
};