var webpack = require('webpack');

module.exports = {
    entry: ['./wwwroot/js/minescape/puzzle.js', './wwwroot/js/minescape/light.js', './wwwroot/js/minescape/cypher.js', './wwwroot/js/minescape/anagram.js'],
    output: {
        path: __dirname + '/wwwroot/dist',
        filename: 'minescape.js',
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
            //{
            //    test: /\.m?js$/,
            //    loader: 'babel-loader',
            //    include: [
            //        __dirname, "/wwwroot/dist",
            //    ],
            //    options: {
            //        presets: ["@babel/preset-env"]
            //    }
            //},
            //{
            //    test: /\.css$/,
            //    use: [
            //        { loader: "style-loader" },
            //        { loader: "css-loader" }
            //    ]
            //}
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
    mode: 'development',
};