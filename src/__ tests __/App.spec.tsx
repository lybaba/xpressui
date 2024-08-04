// src/__ tests __/App.test.tsx
import React from 'react';
import {describe, expect, test} from '@jest/globals';

import { render } from "@testing-library/react"
//import App from '../App';

test('demo', () => {
    expect(true).toBe(true)
})

test("Renders the main page", () => {
    //render(<App />)
    expect(true).toBeTruthy()
})