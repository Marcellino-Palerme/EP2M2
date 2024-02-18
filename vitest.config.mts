// SPDX-FileCopyrightText: 2024 Marcellino Palerme <marcellino.palerme@inrae.fr>

// SPDX-License-Identifier: MIT
import { defineVitestConfig } from "@nuxt/test-utils/config";
import Components from "unplugin-vue-components/vite";
import * as path from "path";
import vue from "@vitejs/plugin-vue";

const r = (p: string) => path.resolve(__dirname, p);

export default defineVitestConfig({
    // root:".",
    // base:".",
    plugins:[
        Components({ 
            dirs: ["./components/**", "./components/"], 
            directoryAsNamespace: true,
            // Use Component of Nuxt/UI without prefix
            resolvers:[
                (componentNames) => {
                    // TODO: Get prefix in configuration of Nuxt/ui
                    if(componentNames.startsWith("U")){
                        return {name: componentNames.slice(1), from: "@nuxt/ui"};
                    }                                        
                }
            ]
        }),
        vue(),
    ],
    test: {
        setupFiles: "dotenv/config",
        globals: true,
        environment: "jsdom",
        server: {
            deps: {
                inline: ["vuetify"],
            },
        },
        coverage:{
            reporter: ["json-summary", "json", "html"],
            lines: 80,
            branches: 80,
            functions: 80,
            statements: 80,
            // If you want a coverage reports even if your tests are failing, include the reportOnFailure option
            reportOnFailure: true,
            // reportsDirectory: "./test/results/coverage"
        },
        reporters: ["junit", "json", "verbose"],
        outputFile: {
            junit: "./test/results/results.xml",
            json: "./test/results/results.json"
        },
    },

    resolve: {
        alias: {
            // "@": fileURLToPath(new URL(".", import.meta.url)),
            "~": r("."),
            // "#imports":fileURLToPath(new URL("./.nuxt/imports.d.ts", import.meta.url)) 
        },
    },
    
});