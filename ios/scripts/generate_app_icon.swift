#!/usr/bin/swift

import AppKit

struct IconColors {
    let background = NSColor(calibratedRed: 15/255, green: 23/255, blue: 42/255, alpha: 1)
    let arc = NSColor(calibratedRed: 56/255, green: 189/255, blue: 248/255, alpha: 1)
    let pulse = NSColor(calibratedRed: 34/255, green: 211/255, blue: 238/255, alpha: 1)
}

let arguments = CommandLine.arguments
guard arguments.count == 2 else {
    fputs("Usage: generate_app_icon.swift <output-path>\n", stderr)
    exit(1)
}

let outputURL = URL(fileURLWithPath: arguments[1])
let iconSize = CGSize(width: 1024, height: 1024)
let colors = IconColors()

let image = NSImage(size: iconSize)
image.lockFocus()

NSGraphicsContext.current?.shouldAntialias = true
let context = NSGraphicsContext.current!.cgContext
context.setShouldAntialias(true)

// Background
context.setFillColor(colors.background.cgColor)
context.fill(CGRect(origin: .zero, size: iconSize))

let center = CGPoint(x: iconSize.width / 2, y: iconSize.height * 0.55)
let arcAngles: (start: CGFloat, end: CGFloat) = (start: .pi * 5 / 4, end: -.pi / 4)
let arcLineWidth: CGFloat = 60
let radii: [CGFloat] = [360, 260, 170]

context.setStrokeColor(colors.arc.cgColor)
context.setLineCap(.round)
context.setLineWidth(arcLineWidth)

for radius in radii {
    context.addArc(center: center, radius: radius, startAngle: arcAngles.start, endAngle: arcAngles.end, clockwise: true)
    context.strokePath()
}

// Pulse circle
let pulseDiameter: CGFloat = 200
let pulseRect = CGRect(x: center.x - pulseDiameter / 2, y: center.y - pulseDiameter / 2 - 80, width: pulseDiameter, height: pulseDiameter)
context.setFillColor(colors.pulse.cgColor)
context.fillEllipse(in: pulseRect)

image.unlockFocus()

guard let data = image.tiffRepresentation,
      let bitmapRep = NSBitmapImageRep(data: data),
      let pngData = bitmapRep.representation(using: .png, properties: [:]) else {
    fputs("error: Failed to generate PNG data for app icon\n", stderr)
    exit(2)
}

try FileManager.default.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)
try pngData.write(to: outputURL, options: .atomic)
print("Generated app icon at \(outputURL.path)")
